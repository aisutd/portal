import type { MembershipType, ProgramType, UserRole, TEAM } from "@prisma/client";

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

/** Roles permitted to create, edit or publish program applications. */
export const APPLICATION_MANAGER_ROLES = ["EXECUTIVE", "DIRECTOR"] as const satisfies readonly UserRole[];

/** Roles that reach Academy admin on role alone, without needing a team. */
export const ACADEMY_MANAGER_ROLES = ["EXECUTIVE", "DIRECTOR"] as const satisfies readonly UserRole[];

/** The team whose Officers run AI Academy. */
export const ACADEMY_TEAM = "AI_ACADEMY" as const satisfies TEAM;

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

export type MembershipItem = {
  membershipType: MembershipType;
  activeFlag?: boolean;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
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

/** Create, edit or publish program applications. Reviewing is a separate axis. */
export function canManageApplications(role: string | null | undefined): boolean {
  return !!role && (APPLICATION_MANAGER_ROLES as readonly string[]).includes(role);
}

/**
 * Checks whether a single membership record is active right now.
 * Validates activeFlag = true and checks if today falls within startDate and endDate (if set).
 */
export function isMembershipActive(
  m: MembershipItem,
  allowedTypes: readonly MembershipType[] = ["AI_ACADEMY"]
): boolean {
  if (!allowedTypes.includes(m.membershipType)) return false;
  if (m.activeFlag === false) return false;

  const now = new Date();

  if (m.startDate && new Date(m.startDate) > now) {
    return false;
  }

  if (m.endDate && new Date(m.endDate) < now) {
    return false;
  }

  return true;
}

/**
 * Whether someone may reach Academy admin.
 *
 * Executives and Directors qualify by role. Officers qualify only when their
 * team affiliation is AI Academy — this is the one place team is load-bearing
 * rather than decorative, so callers must pass the real User.team value.
 */
export function canManageAcademy(
  role: string | null | undefined,
  team: TEAM | null | undefined
): boolean {
  if (!!role && (ACADEMY_MANAGER_ROLES as readonly string[]).includes(role)) return true;
  return role === "OFFICER" && team === ACADEMY_TEAM;
}

/**
 * Whether someone may publish Academy workshops.
 *
 * Mirrors events: Officers draft, Directors and Executives publish.
 */
export function canPublishAcademy(role: string | null | undefined): boolean {
  return !!role && (ACADEMY_MANAGER_ROLES as readonly string[]).includes(role);
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

/* -------------------------------------------------------------------------- */
/* Application review access                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Postings an AIM mentor may review. Mentors read the applications for the
 * program they mentor in — not the mentor postings themselves.
 */
export const AIM_MENTOR_PROGRAM_TYPES = [
  "AI_MENTORSHIP_MENTEE",
] as const satisfies readonly ProgramType[];

/** True when the member holds an active AIM mentor program membership. */
export function hasAimMentorProgram(
  programs: readonly MembershipType[] | null | undefined
): boolean {
  return !!programs?.includes("AIM_MENTOR");
}

/**
 * Whether someone may reach the applications review UI at all.
 *
 * Admin roles qualify by role. AIM mentors qualify by program membership alone —
 * their User.role stays MEMBER, so this is the only thing that lets them in.
 */
export function canReviewApplications(
  role: string | null | undefined,
  programs: readonly MembershipType[] | null | undefined
): boolean {
  return isAdminRole(role) || hasAimMentorProgram(programs);
}

/**
 * True only for someone who reaches the review surface purely through a
 * program membership, never by role — an AIM mentor. Admin roles have their
 * own "Admin" entry point and are excluded here even if they also happen to
 * hold an AIM_MENTOR membership.
 */
export function isApplicationReviewerOnly(
  role: string | null | undefined,
  programs: readonly MembershipType[] | null | undefined
): boolean {
  return !isAdminRole(role) && hasAimMentorProgram(programs);
}

/**
 * Which postings a reviewer may see, as a program-type allow-list.
 *
 * `null` means unrestricted — every posting — and is what admin roles get. An
 * array narrows the reviewer to those program types; an empty array means no
 * access at all. Callers must check the requested posting against this rather
 * than trusting the UI to have filtered it.
 */
export function reviewableProgramTypes(
  role: string | null | undefined,
  programs: readonly MembershipType[] | null | undefined
): ProgramType[] | null {
  if (isAdminRole(role)) return null;
  return hasAimMentorProgram(programs) ? [...AIM_MENTOR_PROGRAM_TYPES] : [];
}

/** Whether a specific posting falls inside a reviewer's allow-list. */
export function canReviewProgramType(
  allowed: ProgramType[] | null,
  programType: ProgramType | null | undefined
): boolean {
  if (allowed === null) return true;
  return !!programType && allowed.includes(programType);
}

/**
 * Checks whether a user holds an active AI_ACADEMY membership.
 *
 * Accepts either:
 * 1. An array of Prisma `Membership` objects (e.g. from user.memberships)
 * 2. An array of simple `MembershipType` strings (assumes active if passed)
 * 3. A single `Membership` object
 */
export function hasActiveAcademyMembership(
  input:
    | readonly MembershipItem[]
    | readonly MembershipType[]
    | MembershipItem
    | null
    | undefined
): boolean {
  if (!input) return false;

  // Single Membership Object
  if (!Array.isArray(input)) {
    return isMembershipActive(input as MembershipItem);
  }

  // Array of items
  return input.some((item) => {
    if (typeof item === "string") {
      return item === "AI_ACADEMY";
    }
    if (typeof item === "object" && item !== null) {
      return isMembershipActive(item);
    }
    return false;
  });
}

/**
 * Determines whether a user should see and access Academy participant resources.
 * Granted to:
 * - Directors & Executives (by role)
 * - Officers affiliated with the AI_ACADEMY team
 * - Members with an active AI_ACADEMY membership
 */
export function isAcademyParticipant(params: {
  role: string | null | undefined;
  team?: TEAM | null | undefined;
  memberships?: Parameters<typeof hasActiveAcademyMembership>[0];
}): boolean {
  const { role, team, memberships } = params;

  // 1. All Directors and Executives
  if (role === "DIRECTOR" || role === "EXECUTIVE") {
    return true;
  }

  // 2. Officers on the AI Academy team
  if (role === "OFFICER" && team === ACADEMY_TEAM) {
    return true;
  }

  // 3. Active AI_ACADEMY membership holders
  return hasActiveAcademyMembership(memberships);
}

/**
 * Checks whether a user holds an active AIM_MENTOR or AIM_MENTEE membership.
 */
export function hasActiveAimMembership(
  input:
    | readonly MembershipItem[]
    | readonly MembershipType[]
    | MembershipItem
    | null
    | undefined
): boolean {
  if (!input) return false;

  if (!Array.isArray(input)) {
    return isMembershipActive(input as MembershipItem, ["AIM_MENTOR", "AIM_MENTEE"]);
  }

  return input.some((item) => {
    if (typeof item === "string") {
      return item === "AIM_MENTOR" || item === "AIM_MENTEE";
    }
    if (typeof item === "object" && item !== null) {
      return isMembershipActive(item, ["AIM_MENTOR", "AIM_MENTEE"]);
    }
    return false;
  });
}

/**
 * Determines whether a user should see and access AIM participant resources.
 * Granted to:
 * - Directors & Executives (by role)
 * - Officers affiliated with the AIM team
 * - Members with an active AIM_MENTOR or AIM_MENTEE membership
 */
export function isAimParticipant(params: {
  role: string | null | undefined;
  team?: TEAM | null | undefined;
  memberships?: Parameters<typeof hasActiveAimMembership>[0];
}): boolean {
  const { role, team, memberships } = params;

  // 1. All Directors and Executives
  if (role === "DIRECTOR" || role === "EXECUTIVE") {
    return true;
  }

  // 2. Officers on the AIM team
  if (role === "OFFICER" && team === "AIM") {
    return true;
  }

  // 3. Active AIM_MENTOR or AIM_MENTEE membership holders
  return hasActiveAimMembership(memberships);
}