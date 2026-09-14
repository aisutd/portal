import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isApplicationReviewerOnly } from "@/lib/roles";


export async function GET() {
  const session = await auth();

  if (!session.userId) {
    return NextResponse.json({ role: null, firstName: null, isReviewerOnly: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: session.userId },
    select: {
      role: true,
      profile: { select: { firstName: true, prefName: true } },
      memberships: {
        where: { activeFlag: true },
        select: { membershipType: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ role: null, firstName: null, isReviewerOnly: false }, { status: 401 });
  }

  const programs = user.memberships.map((m) => m.membershipType);

  return NextResponse.json({
    role: user.role,
    // Same "given name" convention the members table uses: preferred name wins.
    firstName: user.profile ? user.profile.prefName || user.profile.firstName : null,
    isReviewerOnly: isApplicationReviewerOnly(user.role, programs),
    headers: {
      'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=30',
    }
  });
}
