import { prisma } from "@/lib/prisma";
import type { MemberBadge } from "@/components/admin/members-table";

/** How many events attended per level bump; level 4 is the max. */
const EVENTS_PER_LEVEL = 3;
const MAX_LEVEL = 4;

export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Personal engagement level, separate from the admin Members page's
 * semester-ratio status: this is a simple lifetime attendance count. First
 * event attended = level 1 ("Active"), then a level every 3 more, capped at
 * level 4 by 12 events.
 */
export function deriveActivityLevel(attended: number): ActivityLevel {
  if (attended <= 0) return 0;
  return Math.min(MAX_LEVEL, Math.ceil(attended / EVENTS_PER_LEVEL)) as ActivityLevel;
}

export const ACTIVITY_LEVEL_BADGES: Record<ActivityLevel, MemberBadge> = {
  0: { label: "New Member", outline: true },
  1: { label: "Active", bg: "#d3eccf", color: "#356b2e" },
  2: { label: "Very Active", bg: "#b0dfa0", color: "#2c5d3e" },
  3: { label: "Highly Active", bg: "#8ed184", color: "#1f4a2c" },
  4: { label: "Super Active", bg: "#356b2e", color: "#ffffff" },
};

export async function getLifetimeAttendedCount(userId: string): Promise<number> {
  return prisma.rSVP.count({
    where: { userId, attendance: { isNot: null } },
  });
}

export async function getActivityBadge(userId: string): Promise<MemberBadge> {
  const attended = await getLifetimeAttendedCount(userId);
  return ACTIVITY_LEVEL_BADGES[deriveActivityLevel(attended)];
}
