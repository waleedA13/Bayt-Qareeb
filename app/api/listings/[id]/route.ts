import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEduDbUser } from "@/lib/auth";
import { err, notEdu, prepareListing } from "../prepare";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };
// 404, not 403, so other people's listing ids can't be probed.
const notFound = () => err(404, "Listing not found.");
const isMissing = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025";

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getEduDbUser();
  if (!user) return notEdu();
  const where = { id: params.id, ownerId: user.id };
  const current = await prisma.listing.findFirst({ where, select: { address: true, lat: true, lng: true } });
  if (!current) return notFound();
  const data = await prepareListing(req, current);
  if (data instanceof Response) return data;
  try {
    return Response.json(await prisma.listing.update({ where, data: { ...data, contactEmail: user.email } }));
  } catch (e) {
    if (isMissing(e)) return notFound(); // deleted in the meantime
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getEduDbUser();
  if (!user) return notEdu();
  const { count } = await prisma.listing.deleteMany({ where: { id: params.id, ownerId: user.id } });
  return count ? new Response(null, { status: 204 }) : notFound();
}
