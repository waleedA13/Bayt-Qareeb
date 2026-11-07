import { currentUser, type User } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const EDU = /^[^\s@]+@([a-z0-9-]+\.)+edu$/i;

// Only students whose primary email is a verified .edu address get in.
export function isEduUser(user: User | null) {
  const email = user?.primaryEmailAddress;
  return !!email && email.verification?.status === "verified" && EDU.test(email.emailAddress);
}

// The database User for the signed-in, verified-.edu Clerk user, created on first use; null for anyone else.
export async function getEduDbUser() {
  const user = await currentUser();
  if (!isEduUser(user)) return null;
  const email = user!.primaryEmailAddress!.emailAddress.toLowerCase();
  return prisma.user.upsert({ where: { clerkId: user!.id }, update: { email }, create: { clerkId: user!.id, email } });
}
