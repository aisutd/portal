import type { ComponentType, SVGProps } from "react";
import { ProgramType } from "@prisma/client";

export type ProgramTypeDesign = {
  label: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder?: string;
  image?: string;
  icon?: string | ComponentType<SVGProps<SVGSVGElement>>;
  iconUrl?: string; // Path relative to public folder (e.g. "/icons/ai-academy.svg")
};

export const DEFAULT_PROGRAM_TYPE_DESIGN: ProgramTypeDesign = {
  label: "General",
  iconBg: "#efece3",
  iconColor: "#6a685f",
  borderColor: "#e2ded2",
  badgeBg: "#f3f4f6",
  badgeColor: "#374151",
  badgeBorder: "#e5e7eb",
  icon: "•",
};

export const PROGRAM_TYPE_CONFIG: Record<ProgramType, ProgramTypeDesign> = {
  [ProgramType.AI_ACADEMY]: {
    label: "AI Academy",
    iconBg: "#f7d000",
    iconColor: "#1f3aa3",
    borderColor: "#e7e2d4",
    badgeBg: "#fef9c3",
    badgeColor: "#1f3aa3", // Swapped to brand deep blue for crisp contrast
    badgeBorder: "#fde047",
    image: "/images/ais logos/academy full logo.png",
    iconUrl: "/images/ais%20logos/academy%20full%20logo.png",
    icon: "◇",
  },
  [ProgramType.AI_INNOVATION]: {
    label: "AI Innovation",
    iconBg: "#9c14dc",
    iconColor: "#ffffff", // Changed from dark purple #4b4178 to white for readability on #9c14dc
    borderColor: "#e7e2d4",
    badgeBg: "#f3e8ff",
    badgeColor: "#4b4178", // Utilized your #4b4178 here for soft contrast
    badgeBorder: "#d8b4fe",
    image: "/images/ais logos/inno_logo.png",
    iconUrl: "/images/ais%20logos/inno%20logo.png",
    icon: "◆",
  },
  [ProgramType.AI_MENTORSHIP_MENTOR]: {
    label: "AIM Mentor",
    iconBg: "#7ed857",
    iconColor: "#7a4416",
    borderColor: "#f2a968",
    badgeBg: "#ffedd5",
    badgeColor: "#7a4416",
    badgeBorder: "#fed7aa",
    image: "/images/programs/aim.png",
    iconUrl: "/icons/aim.svg",
    icon: "◈",
  },
  [ProgramType.AI_MENTORSHIP_MENTEE]: {
    label: "AIM Mentee",
    iconBg: "#7ed857",
    iconColor: "#164e63", // Deep slate green/teal for high contrast over green
    borderColor: "#7ed857",
    badgeBg: "#f0fdf4", // Fixed badge contrast from identical #7ed857 values
    badgeColor: "#166534",
    badgeBorder: "#bbf7d0",
    image: "/images/ais logos/aim logo.png",
    iconUrl: "/images/ais logos/aim logo.png",
    icon: "◈",
  },
  [ProgramType.OFFICER]: {
    label: "Officer",
    iconBg: "#2f5fe8",
    iconColor: "#ffffff",
    borderColor: "#2f5fe8",
    badgeBg: "#e0e7ff",
    badgeColor: "#1f3aa3",
    badgeBorder: "#c7d2fe",
    iconUrl: "/images/ais logos/officer.png",
    icon: "★",
  },
  [ProgramType.OTHER]: {
    label: "General",
    iconBg: "#efece3",
    iconColor: "#6a685f",
    borderColor: "#e2ded2",
    badgeBg: "#f4f1e7",
    badgeColor: "#55555f",
    badgeBorder: "#e7e2d4",
    iconUrl: "/images/programs/aws-logo.png",
    icon: "•",
  },
};

/**
 * Safely resolves a ProgramType, string enum value, or custom ProgramTypeDesign object
 * into a fully formed ProgramTypeDesign config.
 */
export function getProgramTypeDesign(
  programType?: ProgramType | string | Partial<ProgramTypeDesign> | null
): ProgramTypeDesign {
  if (!programType) {
    return DEFAULT_PROGRAM_TYPE_DESIGN;
  }

  if (typeof programType === "object") {
    return {
      ...DEFAULT_PROGRAM_TYPE_DESIGN,
      ...programType,
    };
  }

  const key = programType as ProgramType;
  if (key in PROGRAM_TYPE_CONFIG) {
    return PROGRAM_TYPE_CONFIG[key];
  }

  return DEFAULT_PROGRAM_TYPE_DESIGN;
}