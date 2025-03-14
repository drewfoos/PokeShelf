import { NextResponse } from 'next/server';
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
  "/terms(.*)",
  "/robots.txt",
  "/humans.txt",
  "/sitemap.xml(.*)"
]);

// Common bot probe paths that should return 404 immediately
const BOT_PROBE_PATTERNS = [
  /^\/(wp|wordpress|wp-admin|wp-content|wp-includes)/i,
  /^\/admin\/(Cms_Wysiwyg|downloader|login)/i,
  /^\/admin\.php/i,
  /^\/administrator\//i,
  /^\/bitrix\//i,
  /^\/magento\//i,
  /^\/store\//i,
  /^\/joomla\//i,
  /^\/drupal\//i,
  /^\/user\/login/i,
  /^\/xmlrpc\.php/i,
  /^\/setup-config\.php/i,
  /^\/phpMyAdmin/i,
  /^\/\.env/i,
  /^\/\.git\//i,
];

// Custom middleware that runs before Clerk's middleware
export default clerkMiddleware(async (auth, request) => {
  const { pathname } = new URL(request.url);
  
  // Check if path matches any known bot probe pattern
  if (BOT_PROBE_PATTERNS.some(pattern => pattern.test(pathname))) {
    // Return 404 for bot probes
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }
  
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