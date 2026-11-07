import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { isEduUser } from "@/lib/auth";
import { Shell, StudentsOnly } from "../Shell";
import ListingForm from "../ListingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Post a room · Bayt Qareeb" };

export default async function NewListingPage() {
  if (!isEduUser(await currentUser())) return <StudentsOnly />;
  return (
    <Shell
      title="Post a room"
      action={<Link href="/listings/mine" className="grid min-h-[44px] place-items-center rounded-lg px-1 font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">My listings</Link>}
    >
      <p className="mt-2 text-ink/70">Only verified students can see it. Renters will contact you at your college email.</p>
      <ListingForm />
    </Shell>
  );
}
