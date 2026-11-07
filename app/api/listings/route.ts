import { prisma } from "@/lib/db";
import seed from "@/prisma/seed-data.json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await prisma.listing.findMany());
  } catch {
    // ponytail: no SQLite file on Vercel, so serve the seed data for the demo.
    return Response.json(seed.map((l, i) => ({ id: `seed-${i}`, ...l })));
  }
}
