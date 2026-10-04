import type { MembershipType, TEAM, UserRole } from "@prisma/client";

type VisibilityFields = {
  // Nullable here even though the schema types them as always-arrays:
  // existing rows from before this field existed can have NULL at the DB
  // level if the migration that added them didn't backfill old rows, so
  // Prisma can hand back undefined/null here despite the generated type.
  visibilityRoles: UserRole[] | null | undefined;
  visibilityMembership: MembershipType[] | null | undefined;
  visibilityTeams: TEAM[] | null | undefined;
};

type Viewer = {
  role: UserRole;
  team: TEAM | null;
  /** Active membership types only — callers filter by activeFlag before passing this in. */
  memberships: readonly MembershipType[];
};

/**
 * Every event defaults to `visibilityRoles: [MEMBER]` with empty membership/team
 * scopes — that default means "every signed-in member, same as before this field
 * existed," so it stays open to signed-out viewers too (the public /events page
 * doesn't require sign-in). An event is actually RESTRICTED once it drops MEMBER
 * from visibilityRoles and/or sets a membership or team scope — e.g. an AIM
 * meeting with visibilityRoles: [EXECUTIVE], visibilityMembership:
 * [AIM_MENTOR, AIM_MENTEE].
 */
/** True for events scoped to AIM mentors/mentees — the single source of truth
 *  for "is this an AIM event," reused for both access control and the AIM tag. */
export function isAimEvent(event: { visibilityMembership: MembershipType[] | null | undefined }): boolean {
  const membership = event.visibilityMembership ?? [];
  return membership.includes("AIM_MENTOR") || membership.includes("AIM_MENTEE");
}

export function canViewEvent(event: VisibilityFields, viewer: Viewer | null): boolean {
  const roles = event.visibilityRoles ?? ["MEMBER"];
  const membership = event.visibilityMembership ?? [];
  const teams = event.visibilityTeams ?? [];

  const isDefaultPublic = membership.length === 0 && teams.length === 0 && roles.includes("MEMBER");

  if (isDefaultPublic) return true;
  if (!viewer) return false;

  return (
    roles.includes(viewer.role) ||
    viewer.memberships.some((m) => membership.includes(m)) ||
    (viewer.team != null && teams.includes(viewer.team))
  );
}
