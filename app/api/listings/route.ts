import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const listings = await prisma.listing.findMany();
  return Response.json(listings);
}
