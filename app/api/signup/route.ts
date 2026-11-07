import { prisma } from "@/lib/db";

const EDU = /^[^\s@]+@([a-z0-9-]+\.)+edu$/i;

export async function POST(req: Request) {
  const { email, name } = await req.json();
  if (!email || !EDU.test(email)) {
    return Response.json({ error: "Only .edu emails can sign up." }, { status: 403 });
  }
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: { email: email.toLowerCase(), name },
  });
  return Response.json(user);
}
