import type { User } from "@clerk/nextjs/server";

export const EDU = /^[^\s@]+@([a-z0-9-]+\.)+edu$/i;

// Only students whose primary email is a verified .edu address get in.
export function isEduUser(user: User | null) {
  const email = user?.primaryEmailAddress;
  return !!email && email.verification?.status === "verified" && EDU.test(email.emailAddress);
}
