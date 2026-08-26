import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isAdminRole, isKnownRole } from '@/lib/roles';

// MUST be exported as default and return JSX / ReactNode
export default async function AdminEventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session.userId) {
    redirect('/onboarding?mode=login');
  }

  const claimedRole = session.sessionClaims?.metadata?.role;
  let role = isKnownRole(claimedRole) ? claimedRole : undefined;

  if (!role) {
    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { role: true },
    });
    role = user?.role;
  }

  if (!isAdminRole(role)) {
    redirect('/dashboard');
  }

  // MUST return children inside a wrapper or fragment
  return <>{children}</>;
}