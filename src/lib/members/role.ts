import type { RoleKey } from "./badges";

/** Same set the admin route gate uses in src/proxy.ts. */
const OFFICER_ROLES = new Set(["REVIEWER", "ORGANIZER", "SUPER_ADMIN"]);

const MEMBERSHIP_ROLE: Record<string, RoleKey> = {
  AIM_MENTOR: "mentor",
  AIM_MENTEE: "mentee",
  AI_STUDENT: "student",
  AI_INNOVATOR: "innovator",
  ALUMNUS: "alumnus",
  NON_MEMBER: "member",
};

/**
 * One badge per member. An officer reads as Officer even when they also hold
 * a mentor or mentee membership.
 */
export function deriveRoleKey(userRole: string, membershipType: string | null): RoleKey {
  if (OFFICER_ROLES.has(userRole)) return "officer";
  if (membershipType) return MEMBERSHIP_ROLE[membershipType] ?? "member";
  return "member";
}
