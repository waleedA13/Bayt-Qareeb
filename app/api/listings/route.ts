import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getEduDbUser, isEduUser } from "@/lib/auth";
import { err, notEdu, prepareListing } from "./prepare";

export const dynamic = "force-dynamic";

export async function GET() {
  // Listings include students' contact emails, so only verified .edu users can read them.
  if (!isEduUser(await currentUser())) {
    return Response.json({ error: "Only verified .edu students can view listings." }, { status: 403 });
  }
  const listings = await prisma.listing.findMany();
  return Response.json(listings);
}

const MAX_LISTINGS = 5;

export async function POST(req: Request) {
  const user = await getEduDbUser();
  if (!user) return notEdu();
  // shortcut: check-then-create, so two posts at the same instant could make a 6th; add a DB constraint if that matters.
  if ((await prisma.listing.count({ where: { ownerId: user.id } })) >= MAX_LISTINGS) {
    return err(429, `You can have up to ${MAX_LISTINGS} listings. Delete one to post another.`);
  }
  const data = await prepareListing(req);
  if (data instanceof Response) return data;
  const listing = await prisma.listing.create({ data: { ...data, ownerId: user.id, contactEmail: user.email } });
  return Response.json(listing, { status: 201 });
}
