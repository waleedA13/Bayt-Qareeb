import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import AuthShell from "@/components/AuthShell";
import { Logo } from "@/components/brand";

export function Shell({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-30 mx-auto max-w-xl px-3 pt-3">
        <div className="glass flex h-16 items-center justify-between gap-3 rounded-2xl pl-3 pr-2 shadow-[0_10px_30px_rgba(20,33,61,0.14)]">
          <Logo />
          <Link href="/map" className="inline-flex min-h-[44px] items-center rounded-full px-4 font-semibold hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">
            Back to map
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-10 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-[28px] font-bold leading-tight">{title}</h1>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
}

// Same screen app/layout.tsx shows non-.edu users; repeated here so these pages stay gated on their own.
export function StudentsOnly() {
  return (
    <AuthShell>
      <div className="glass w-[25rem] max-w-full rounded-3xl p-8 text-center shadow-[0_16px_40px_rgba(20,33,61,0.22)]">
        <h1 className="font-display text-2xl font-bold">Students only</h1>
        <p className="mt-2 text-ink/70">
          Bayt Qareeb is open to verified <b className="text-ink">.edu</b> emails only. Sign out and sign up with your college email.
        </p>
        <SignOutButton>
          <button className="mt-6 min-h-[48px] w-full rounded-xl bg-ink px-6 font-semibold text-white hover:bg-ink/90 focus-visible:outline focus-visible:outline-4 focus-visible:outline-ink/25">Sign out</button>
        </SignOutButton>
      </div>
    </AuthShell>
  );
}
