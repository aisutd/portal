import type { MembershipType, UserRole } from "@prisma/client";
import type { MemberBadge } from "../../components/admin/members-table";

export type StatusKey = "active" | "atRisk" | "inactive";

/** Permission badges. MEMBER has no badge of its own — see role.ts. */
export const USER_ROLE_BADGES: Record<UserRole, MemberBadge> = {
  EXECUTIVE: { label: "Executive", bg: "#dfe0f6", color: "#332b78" },
  OFFICER: { label: "Officer", bg: "#e1e8ff", color: "#1f3aa3" },
  MEMBER: { label: "Member", outline: true },
};

export const PROGRAM_BADGES: Record<MembershipType, MemberBadge> = {
  AIM_MENTOR: { label: "AIM Mentor", bg: "#e9e5f6", color: "#4b4178" },
  AIM_MENTEE: { label: "AIM Mentee", outline: true },
  AI_ACADEMY: { label: "AI Academy", bg: "#dcece8", color: "#2f5f55" },
  INNOVATION_LABS: { label: "Innovation Labs", bg: "#fbe3cb", color: "#7a4416" },
};

export const STATUS_BADGES: Record<StatusKey, MemberBadge> = {
  active: { label: "Active", bg: "#d3eccf", color: "#356b2e" },
  atRisk: { label: "At risk", bg: "#fbe3cb", color: "#7a4416" },
  inactive: { label: "Inactive", bg: "#efece3", color: "#6a685f" },
};
