import { clerkMiddleware } from "@clerk/nextjs/server";

// Every page and API route needs a signed-in user; the .edu check runs in the layout and API routes.
export default clerkMiddleware(async (auth) => {
  await auth.protect();
}, { publishableKey: process.env.NEXT_CLERK_PUBLISHABLE_KEY });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
