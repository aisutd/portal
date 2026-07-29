import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const isPublicRoute = createRouteMatcher([
  '/',
  '/events(.*)',
  '/applications(.*)',
  '/onboarding(.*)',
  '/api/webhooks(.*)',
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const allowedAdminRoles = ['REVIEWER', 'ORGANIZER', 'SUPER_ADMIN'];

export default clerkMiddleware(async (auth, req) => {
  const session = await auth();

  // Everything except the public routes above requires sign-in
  if (!isPublicRoute(req) && !session.userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // Extra role gate on top of that, for admin routes only
  if (isAdminRoute(req)) {
    let role = session.sessionClaims?.metadata?.role as string | undefined;

    if (!role && session.userId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: session.userId },
        select: { role: true },
      });
      role = user?.role;
    }

    if (!role || !allowedAdminRoles.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
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