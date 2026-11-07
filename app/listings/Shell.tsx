import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

// Eight-point star (Rub el Hizb), same mark as the map page.
function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 1l2.6 4.4L19.8 4.2 18.6 9.4 23 12l-4.4 2.6 1.2 5.2-5.2-1.2L12 23l-2.6-4.4-5.2 1.2 1.2-5.2L1 12l4.4-2.6L4.2 4.2l5.2 1.2z" />
    </svg>
  );
}

export function Shell({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-2.5">
          <Link href="/" className="flex min-h-[44px] items-center gap-2 rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-ink/30">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink">
              <Star className="h-5 w-5 text-white" />
            </span>
            <span className="font-display text-xl font-bold tracking-wide">Bayt Qareeb</span>
          </Link>
          <Link href="/" className="ml-auto grid min-h-[44px] place-items-center rounded-lg px-3 text-[15px] font-semibold underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">
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

// Same message as app/layout.tsx shows non-.edu users; repeated here so these pages stay gated on their own.
export function StudentsOnly() {
  return (
    <main className="grid h-dvh place-items-center bg-paper p-6 text-center text-ink">
      <div className="max-w-sm">
        <h1 className="font-display text-2xl font-bold">Students only</h1>
        <p className="mt-2 text-ink/70">
          Bayt Qareeb is open to verified <b>.edu</b> emails only. Sign out and sign up with your college email.
        </p>
        <SignOutButton>
          <button className="mt-6 min-h-[48px] rounded-xl bg-ink px-6 font-semibold text-white hover:bg-ink/90">Sign out</button>
        </SignOutButton>
      </div>
    </main>
  );
}
