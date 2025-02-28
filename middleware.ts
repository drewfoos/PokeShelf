import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes - everything else will be protected
const isPublicRoute = createRouteMatcher([
  "/",
  "/search(.*)",
  "/card/(.*)",
  "/sets",
  "/sets/(.*)",
  "/api/sets(.*)",
  "/api/cards(.*)",
  "/api/search(.*)",
  "/api/webhooks(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy(.*)",
  "/terms(.*)"
]);


export default clerkMiddleware(async (auth, request) => {
  // If the route is not public, protect it
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files with extensions (.jpg, .jpeg, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|js|css)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};