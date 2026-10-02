import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import type { MembershipType, ProgramType, TEAM, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  canManageAcademy,
  canManageAim,
  canPublishAcademy,
  canReviewApplications,
  isAdminRole,
  isApplicationReviewerOnly,
  reviewableProgramTypes,
} from "@/lib/roles";

export type AdminViewer = {
  id: string;
  role: UserRole;
  /** Organizational team. Load-bearing for Academy admin, decorative elsewhere. */
  team: TEAM | null;
  firstName: string | null;
  lastName: string | null;
  programs: MembershipType[];
  /** Officer, Director or Executive. */
  isAdmin: boolean;
  /** May reach the applications review surface. */
  canReview: boolean;
  /** Qualifies only through a program membership, never by role. */
  isReviewerOnly: boolean;
  /** Postings they may review; null means unrestricted. */
  allowedProgramTypes: ProgramType[] | null;
  /** May reach Academy admin — Executive, Director, or an AI Academy Officer. */
  canManageAcademy: boolean;
  /** May publish workshops rather than only saving drafts. */
  canPublishAcademy: boolean;
  /** May reach AIM admin — an admin role, or an AIM mentor by program membership alone. */
  canManageAim: boolean;
};

export const getAdminViewer = cache(async function getAdminViewer(): Promise<AdminViewer | null> {
  const session = await auth();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: session.userId },
    select: {
      id: true,
      role: true,
      team: true,
      profile: { select: { firstName: true, lastName: true, prefName: true } },
      memberships: {
        where: { activeFlag: true },
        select: { membershipType: true },
      },
    },
  });

  if (!user) return null;

  const programs = user.memberships.map((m) => m.membershipType);
  const isAdmin = isAdminRole(user.role);
  const canReview = canReviewApplications(user.role, programs);

  return {
    id: user.id,
    role: user.role,
    team: user.team,
    firstName: user.profile ? user.profile.prefName || user.profile.firstName : null,
    lastName: user.profile?.lastName ?? null,
    programs,
    isAdmin,
    canReview,
    isReviewerOnly: isApplicationReviewerOnly(user.role, programs),
    allowedProgramTypes: reviewableProgramTypes(user.role, programs),
    canManageAcademy: canManageAcademy(user.role, user.team),
    canPublishAcademy: canPublishAcademy(user.role),
    canManageAim: canManageAim(user.role, programs),
  };
});

/** Badge label for the admin chrome. Reviewers are shown their program, not "Member". */
export function adminRoleLabel(viewer: AdminViewer | null): string {
  if (!viewer) return "Officer";
  if (viewer.isReviewerOnly) return "AIM Mentor";
  return viewer.role.charAt(0) + viewer.role.slice(1).toLowerCase();
}
