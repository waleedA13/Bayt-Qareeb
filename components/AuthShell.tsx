import Link from "next/link";
import { Logo, MapBackdrop } from "@/components/brand";

// Backdrop for sign-in / sign-up / "Students only": the landing hero's still map with a floating glass bar.
export default function AuthShell({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <MapBackdrop />
      <header className="mx-auto w-full max-w-7xl px-3 pt-3 md:px-6 md:pt-5">
        <div className="glass flex h-16 items-center justify-between gap-4 rounded-2xl pl-3 pr-3 shadow-[0_10px_30px_rgba(20,33,61,0.14)]">
          <Logo />
          <Link href="/" className="inline-flex min-h-[44px] items-center rounded-full px-4 font-semibold hover:bg-ink/5">Back to home</Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 motion-safe:animate-fade-up">
        {aside}
        {children}
      </main>
    </div>
  );
}
