import Anthropic from "@anthropic-ai/sdk";
import { currentUser } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isEduUser } from "@/lib/auth";
import { validateFilters } from "@/lib/searchFilters";

export const dynamic = "force-dynamic";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY; server-only route

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    maxRent: { type: "number", description: "Max monthly rent share in USD" },
    genderPref: { type: "string", enum: ["BROTHERS", "SISTERS", "ANY"] },
    roomType: { type: "string", enum: ["PRIVATE", "SHARED"] },
    petsAllowed: { type: "boolean" },
    halalKitchen: { type: "boolean" },
    nearText: { type: "string", description: "Place, campus, city or street the user wants to be near" },
  },
  required: [],
};

const SYSTEM =
  "Convert a student's roommate-listing search into filters. Only set a field when the query clearly asks for it; omit everything else. " +
  "maxRent is the user's own monthly share in USD. genderPref: BROTHERS for men/brothers-only, SISTERS for women/sisters-only. " +
  "nearText is a short place name copied from the query (e.g. 'UCLA', 'Berkeley').";

export async function POST(req: Request) {
  // Results include students' contact emails, same gate as /api/listings (and it spends API credits).
  if (!isEduUser(await currentUser())) {
    return Response.json({ error: "Only verified .edu students can search listings." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query || query.length > 300) {
    return Response.json({ error: "Query must be 1-300 characters." }, { status: 400 });
  }

  let raw: unknown;
  try {
    const res = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 1024,
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: query }],
    });
    if (res.stop_reason === "refusal") {
      return Response.json({ error: "Search could not be interpreted." }, { status: 422 });
    }
    const text = res.content.find((b) => b.type === "text");
    raw = text && text.type === "text" ? JSON.parse(text.text) : null;
  } catch (e) {
    console.error("search: model call failed", e);
    return Response.json({ error: "Search is unavailable right now." }, { status: 502 });
  }

  const filters = validateFilters(raw);
  const where: Prisma.ListingWhereInput = {};
  if (filters.maxRent !== undefined) where.rentShare = { lte: filters.maxRent };
  if (filters.genderPref) where.genderPref = filters.genderPref;
  if (filters.roomType) where.roomType = filters.roomType;
  if (filters.petsAllowed !== undefined) where.petsAllowed = filters.petsAllowed;
  if (filters.halalKitchen !== undefined) where.halalKitchen = filters.halalKitchen;
  // shortcut: substring match on address/title, not geo distance; upgrade to geocoding + radius if needed
  if (filters.nearText) {
    where.OR = [{ address: { contains: filters.nearText } }, { title: { contains: filters.nearText } }];
  }

  const listings = await prisma.listing.findMany({ where });
  return Response.json({ filters, listings });
}
