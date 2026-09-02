import type { MembershipType, UserRole, TEAM } from "@prisma/client";

/**
 * Roles live on three axes:
 *
 *   User.role                 permission — one per person, gates /admin
 *   User.team                 team affiliation — optional, links Officers/Directors to teams
 *   Membership.membershipType program participation — many per person, dated
 *
 * This module is the single source of truth across the app.
 */

/** Permission roles that may reach /admin. */
export const ADMIN_ROLES = ["OFFICER", "DIRECTOR", "EXECUTIVE"] as const satisfies readonly UserRole[];

/** Roles permitted to assign or modify user roles and team affiliations. */
export const ROLE_MANAGER_ROLES = ["EXECUTIVE", "DIRECTOR"] as const satisfies readonly UserRole[];

/** All valid permission roles. */
export const ALL_USER_ROLES = ["MEMBER", "OFFICER", "DIRECTOR", "EXECUTIVE"] as const satisfies readonly UserRole[];

/** Assignable permission roles, in the order the editor dropdown lists them. */
export const ASSIGNABLE_USER_ROLES = ["MEMBER", "OFFICER", "DIRECTOR", "EXECUTIVE"] as const satisfies readonly UserRole[];

/** Assignable programs, in the order the editor dropdown lists them. */
export const ASSIGNABLE_PROGRAMS = [
  "AIM_MENTOR",
  "AIM_MENTEE",
  "AI_ACADEMY",
  "INNOVATION_LABS",
] as const satisfies readonly MembershipType[];

/** Assignable organizational teams for Officers & Directors. */
export const ASSIGNABLE_TEAMS = [
  "AI_ACADEMY",
  "AI_INNOVATION",
  "AIM",
  "MARKETING",
  "OPERATIONS",
  "FINANCE",
  "INDUSTRY",
  "TECHNOLOGY",
  "EXECUTIVE",
] as const satisfies readonly TEAM[];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  MEMBER: "Member",
  OFFICER: "Officer",
  DIRECTOR: "Director",
  EXECUTIVE: "Executive",
};

export const PROGRAM_LABELS: Record<MembershipType, string> = {
  AIM_MENTOR: "AIM Mentor",
  AIM_MENTEE: "AIM Mentee",
  AI_ACADEMY: "AI Academy",
  INNOVATION_LABS: "Innovation Labs",
};

export const TEAM_LABELS: Record<TEAM, string> = {
  AI_ACADEMY: "AI Academy",
  AI_INNOVATION: "AI Innovation",
  AIM: "AIM",
  MARKETING: "Marketing",
  OPERATIONS: "Operations",
  FINANCE: "Finance",
  INDUSTRY: "Industry",
  TECHNOLOGY: "Technology",
  EXECUTIVE: "Executive",
};

/**
 * Whether a value is a valid role recognized by the current schema.
 * Checked against ALL_USER_ROLES so DIRECTORS are recognized as valid.
 */
export function isKnownRole(role: unknown): role is UserRole {
  return typeof role === "string" && (ALL_USER_ROLES as readonly string[]).includes(role);
}

/** Accepts a plain string so callers holding unvalidated Clerk metadata can check admin access. */
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

export function isAssignableTeam(value: unknown): value is TEAM {
  return typeof value === "string" && (ASSIGNABLE_TEAMS as readonly string[]).includes(value);
}