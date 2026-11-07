import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { ClerkProvider, SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { isEduUser } from "@/lib/auth";

export const metadata = { title: "Bayt Qareeb · Roommates for Muslim students" };
export const viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    // Vercel warns on NEXT_PUBLIC_* names containing KEY, so the key is passed in by hand.
    <ClerkProvider publishableKey={process.env.NEXT_CLERK_PUBLISHABLE_KEY}>
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Reem+Kufi:wght@500;700&display=swap"
        />
      </head>
      <body className="font-body text-ink antialiased">
        {!user || isEduUser(user) ? children : (
          <main className="grid h-dvh place-items-center bg-paper p-6 text-center">
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
        )}
      </body>
    </html>
    </ClerkProvider>
  );
}