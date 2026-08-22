import type { MembershipType, UserRole } from "@prisma/client";

/**
 * Roles live on two axes, so a person can hold one of each:
 *
 *   User.role               permission — one per person, gates /admin
 *   Membership.membershipType  program — many per person, dated
 *
 * This module is the single source of truth for both. Before it existed the
 * admin role list was copy-pasted in five files.
 */

/** Permission roles that may reach /admin. */
export const ADMIN_ROLES = ["OFFICER", "EXECUTIVE"] as const satisfies readonly UserRole[];

/** Only an Executive may change anyone's roles, including their own. */
export const ROLE_MANAGER_ROLES = ["EXECUTIVE"] as const satisfies readonly UserRole[];

/** Assignable permission roles, in the order the editor lists them. */
export const ASSIGNABLE_USER_ROLES = ["MEMBER", "OFFICER", "EXECUTIVE"] as const satisfies readonly UserRole[];

/** Assignable programs, in the order the editor lists them. */
export const ASSIGNABLE_PROGRAMS = [
  "AIM_MENTOR",
  "AIM_MENTEE",
  "AI_ACADEMY",
  "INNOVATION_LABS",
] as const satisfies readonly MembershipType[];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  MEMBER: "Member",
  OFFICER: "Officer",
  EXECUTIVE: "Executive",
};

export const PROGRAM_LABELS: Record<MembershipType, string> = {
  AIM_MENTOR: "AIM Mentor",
  AIM_MENTEE: "AIM Mentee",
  AI_ACADEMY: "AI Academy",
  INNOVATION_LABS: "Innovation Labs",
};

/**
 * Whether a value is a role this build knows about.
 *
 * Clerk publicMetadata is a cache we do not write, so it can hold values from
 * an older build (EXECUTIVE, ORGANIZER). Callers use this to fall back to
 * the database instead of trusting a dead value.
 */
export function isKnownRole(role: unknown): role is UserRole {
  return typeof role === "string" && (ASSIGNABLE_USER_ROLES as readonly string[]).includes(role);
}

/** Accepts a plain string so callers holding an unvalidated value can ask. */
export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

export function canManageRoles(role: string | null | undefined): boolean {
  return !!role && (ROLE_MANAGER_ROLES as readonly string[]).includes(role);
}

export function isAssignableUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (ASSIGNABLE_USER_ROLES as readonly string[]).includes(value);
}

export function isAssignableProgram(value: unknown): value is MembershipType {
  return typeof value === "string" && (ASSIGNABLE_PROGRAMS as readonly string[]).includes(value);
}
