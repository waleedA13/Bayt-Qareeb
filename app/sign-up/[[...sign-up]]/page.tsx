import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/AuthShell";

export const metadata = { title: "Sign up · Bayt Qareeb" };

export default function SignUpPage() {
  return (
    <AuthShell
      aside={
        <p role="note" className="glass max-w-[25rem] rounded-2xl px-4 py-3 text-center text-[15px] shadow-[0_10px_30px_rgba(20,33,61,0.12)]">
          <b>Students only.</b> Sign up with your college <b>.edu</b> email, like <span className="whitespace-nowrap">you@ucla.edu</span>. Other addresses can&apos;t see rooms.
        </p>
      }
    >
      <SignUp path="/sign-up" />
    </AuthShell>
  );
}
