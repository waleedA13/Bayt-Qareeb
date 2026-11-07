import { prisma } from "@/lib/db";
import { getEduDbUser } from "@/lib/auth";
import { StudentsOnly } from "../Shell";
import MyListings from "./MyListings";

export const dynamic = "force-dynamic";
export const metadata = { title: "My listings · Bayt Qareeb" };

export default async function MyListingsPage() {
  const user = await getEduDbUser();
  if (!user) return <StudentsOnly />;
  const listings = await prisma.listing.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } });
  return <MyListings initial={listings.map(({ createdAt, ownerId, ...l }) => l)} email={user.email} />;
}
