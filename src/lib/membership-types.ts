import { MembershipType } from "@prisma/client"; // import your Prisma Enum

export const MEMBERSHIP_TYPE_LABELS: Record<MembershipType, string> = {
  AIM_MENTEE: "AIM Mentee",
  AIM_MENTOR: "AIM Mentor",
  INNOVATION_LABS: "Innovation Labs",
  AI_ACADEMY: "AI Academy"
};