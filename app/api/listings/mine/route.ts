import { prisma } from "@/lib/db";
import { getEduDbUser } from "@/lib/auth";
import { notEdu } from "../prepare";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getEduDbUser();
  if (!user) return notEdu();
  const listings = await prisma.listing.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } });
  return Response.json(listings);
}
