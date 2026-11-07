import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { ClerkProvider, SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { isEduUser } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";

export const metadata = { title: "Bayt Qareeb · Roommates for Muslim students" };
export const viewport = { width: "device-width", initialScale: 1 };

// Clerk's sign-in / sign-up cards in the map's frosted-glass style.
const appearance = {
  variables: {
    colorPrimary: "#14213D",
    colorText: "#14213D",
    colorTextSecondary: "rgb(20 33 61 / 0.7)",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    fontFamily: "Figtree, system-ui, sans-serif",
    fontSize: "1rem",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full max-w-[25rem]",
    cardBox: "glass !w-full !max-w-full !rounded-3xl !border-0 !shadow-[0_16px_40px_rgba(20,33,61,0.22)]",
    card: "!bg-transparent !shadow-none",
    footer: "!bg-none !bg-white/50",
    headerTitle: "font-display !text-2xl !font-bold",
    formFieldInput: "!min-h-[48px] !text-base",
    formButtonPrimary: "!min-h-[48px] !rounded-xl !bg-ink !text-base !font-semibold !shadow-none hover:!bg-ink/90",
    otpCodeFieldInput: "!text-ink",
  },
};

// Say ".edu only" in the forms themselves, before anyone types an address.
const localization = {
  formFieldLabel__emailAddress: "School email (.edu)",
  formFieldInputPlaceholder__emailAddress: "you@ucla.edu",
  signUp: { start: { title: "Join Bayt Qareeb", subtitle: "Use your college .edu email to find rooms and roommates" } },
  signIn: { start: { title: "Welcome back", subtitle: "Sign in with your college .edu email" } },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const allowed = isEduUser(user);
  return (
    // Vercel warns on NEXT_PUBLIC_* names containing KEY, so the key and URLs are passed in by hand.
    <ClerkProvider
      publishableKey={process.env.NEXT_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/map"
      signUpFallbackRedirectUrl="/map"
      afterSignOutUrl="/"
      appearance={appearance}
      localization={localization}
    >
    <html lang="en">
      <head>
        {allowed && <link rel="preload" href="/api/listings" as="fetch" crossOrigin="anonymous" />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Reem+Kufi:wght@500;700&display=swap"
        />
      </head>
      <body className="font-body text-ink antialiased">
        {!user || allowed ? children : (
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
        )}
      </body>
    </html>
    </ClerkProvider>
  );
}
