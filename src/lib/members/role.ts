import type { MembershipType, UserRole } from "@prisma/client";
import type { MemberBadge } from "../../components/admin/members-table";
import { PROGRAM_BADGES, USER_ROLE_BADGES } from "./badges";

/**
 * Badges for one member, permission first then programs in a stable order.
 *
 * A plain MEMBER with no programs still gets the "Member" badge, so no row is
 * ever blank. Once they hold anything more specific, "Member" is dropped as
 * noise — an Executive is obviously also a member.
 */
export function roleBadges(
  userRole: UserRole,
  programs: readonly MembershipType[]
): MemberBadge[] {
  const badges: MemberBadge[] = [];

  if (userRole !== "MEMBER") {
    badges.push(USER_ROLE_BADGES[userRole]);
  }

  // Deduplicated and ordered by the enum, so two rows never disagree on order.
  for (const program of Object.keys(PROGRAM_BADGES) as MembershipType[]) {
    if (programs.includes(program)) badges.push(PROGRAM_BADGES[program]);
  }

  if (badges.length === 0) badges.push(USER_ROLE_BADGES.MEMBER);

  return badges;
}
