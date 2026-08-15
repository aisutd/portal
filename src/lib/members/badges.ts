import type { MemberBadge } from "../../components/admin/members-table";

export type RoleKey =
  | "officer"
  | "mentor"
  | "mentee"
  | "student"
  | "innovator"
  | "alumnus"
  | "member";

export type StatusKey = "active" | "atRisk" | "inactive";

export const ROLE_BADGES: Record<RoleKey, MemberBadge> = {
  officer: { label: "Officer", bg: "#e1e8ff", color: "#1f3aa3" },
  mentor: { label: "Mentor", bg: "#e9e5f6", color: "#4b4178" },
  mentee: { label: "Mentee", outline: true },
  student: { label: "Student", outline: true },
  innovator: { label: "Innovator", bg: "#e9e5f6", color: "#4b4178" },
  alumnus: { label: "Alumnus", outline: true },
  member: { label: "Member", outline: true },
};

export const STATUS_BADGES: Record<StatusKey, MemberBadge> = {
  active: { label: "Active", bg: "#d3eccf", color: "#356b2e" },
  atRisk: { label: "At risk", bg: "#fbe3cb", color: "#7a4416" },
  inactive: { label: "Inactive", bg: "#efece3", color: "#6a685f" },
};
