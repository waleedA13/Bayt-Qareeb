import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { isEduUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // Listings include students' contact emails, so only verified .edu users can read them.
  if (!isEduUser(await currentUser())) {
    return Response.json({ error: "Only verified .edu students can view listings." }, { status: 403 });
  }
  const listings = await prisma.listing.findMany();
  return Response.json(listings);
}
