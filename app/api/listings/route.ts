import { existsSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import seed from "@/prisma/seed-data.json";

// Cached at the edge and refreshed every 60s (dev mode always reads fresh).
export const revalidate = 60;

const hasDb = existsSync(path.join(process.cwd(), "prisma", "dev.db"));
const seedListings = seed.map((l, i) => ({ id: `seed-${i}`, ...l }));

export async function GET() {
  // ponytail: no SQLite file on Vercel, so serve the seed data straight away.
  if (!hasDb) {
    return Response.json(seedListings);
  }
  return Response.json(await prisma.listing.findMany());
}
