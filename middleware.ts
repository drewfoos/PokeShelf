import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes for your application
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
  "/sitemap(.*)\\.xml"
]);

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

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = new URL(request.url);

  // Explicitly bypass middleware for any sitemap URL.
  if (pathname.startsWith("/sitemap")) {
    return NextResponse.next();
  }

  // Check if the pathname matches any bot probe patterns.
  if (BOT_PROBE_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  // Protect routes that are not public.
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Exclude static assets and sitemap routes.
    "/((?!_next/static|_next/image|favicon.ico|sitemap(?:.*)\\.xml|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|js|css)).*)",
    "/(api|trpc)(.*)",
  ],
};
