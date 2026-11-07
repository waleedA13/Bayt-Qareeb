import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/AuthShell";

export const metadata = { title: "Sign in · Bayt Qareeb" };

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn path="/sign-in" />
    </AuthShell>
  );
}
