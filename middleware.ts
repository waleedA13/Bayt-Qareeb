import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only the landing page and the auth pages are public. Everything else, including /map and every /api route,
// needs a signed-in user; the .edu check runs in the layout and API routes.
const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
}, {
  publishableKey: process.env.NEXT_CLERK_PUBLISHABLE_KEY,
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
