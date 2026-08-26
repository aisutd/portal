import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public route prefixes that bypass authentication entirely
const PUBLIC_PREFIXES = [
  '/events',
  '/applications',
  '/onboarding',
  '/api/webhooks',
  '/api/onboarding/profile',
];

export default clerkMiddleware(async (auth, req) => {
  const { pathname, search } = req.nextUrl;

  // 1. Root route redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 2. Check if route is public using standard string matching
  const isPublicRoute = PUBLIC_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // 3. Require sign-in for all non-public routes
  if (!isPublicRoute) {
    const session = await auth();

    if (!session.userId) {
      const fullPath = `${pathname}${search}`;
      const redirectUrl = new URL('/onboarding', req.url);
      redirectUrl.searchParams.set('mode', 'login');
      redirectUrl.searchParams.set('redirect_url', fullPath);

      return NextResponse.redirect(redirectUrl);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/(.*)',
    '/(api|trpc)(.*)',
  ],
};