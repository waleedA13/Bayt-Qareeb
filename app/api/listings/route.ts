import { existsSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import seed from "@/prisma/seed-data.json";

export const dynamic = "force-dynamic";

const hasDb = existsSync(path.join(process.cwd(), "prisma", "dev.db"));
const seedListings = seed.map((l, i) => ({ id: `seed-${i}`, ...l }));

export async function GET() {
  // ponytail: no SQLite file on Vercel, so serve the seed data straight away (and let the CDN cache it).
  if (!hasDb) {
    return Response.json(seedListings, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  }
  return Response.json(await prisma.listing.findMany());
}
