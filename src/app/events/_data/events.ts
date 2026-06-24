// Mock data for the AIS Portal events experience.
// Mirrors the content shown in the Figma design (file uSi3l5wpSokbD9gfrRt4qp).

export type TagName =
  | "food"
  | "drink"
  | "social"
  | "learn"
  | "workshop"
  | "networking"
  | "industry";

export const TAG_COLORS: Record<TagName, { bg: string; text: string }> = {
  food: { bg: "#f9d5d3", text: "#9a3b36" },
  drink: { bg: "#fbe3c6", text: "#8a4e18" },
  social: { bg: "#f6ecbb", text: "#766411" },
  learn: { bg: "#d3eccf", text: "#356b2e" },
  workshop: { bg: "#cde9e5", text: "#1d6a61" },
  networking: { bg: "#d6e2ff", text: "#284b9c" },
  industry: { bg: "#ded9f4", text: "#463e86" },
};

export const ALL_TAGS: TagName[] = [
  "food",
  "drink",
  "social",
  "learn",
  "workshop",
  "networking",
  "industry",
];

export type EventRecord = {
  id: string;
  title: string;
  /** Short blurb shown on grid cards. */
  blurb: string;
  /** Longer description shown on the detail page. */
  description: string;
  /** Compact meta line for grid cards, e.g. "ECSW 2.412 · 08/27/26 · 7:00 PM". */
  meta: string;
  /** Detail-page meta line, e.g. "Aug 27, 2026 · 7:00 PM · ECSW 1.315". */
  detailMeta: string;
  tags: TagName[];
  /** Whether the current member is checked in (drives the detail sidebar state). */
  checkedIn?: boolean;
};

export const EVENTS: EventRecord[] = [
  {
    id: "fall-kickoff",
    title: "Fall Kickoff",
    blurb: "Learn about & join AIS",
    description:
      "Learn about AIS and get insider notes on how to apply to our initiatives like AIM, Innovation Labs and AI Academy.",
    meta: "ECSW 2.412 · 08/27/26 · 7:00 PM",
    detailMeta: "Aug 27, 2026 · 7:00 PM · ECSW 1.315",
    tags: ["social", "food", "learn"],
    checkedIn: true,
  },
  {
    id: "intro-to-pytorch",
    title: "Intro to PyTorch",
    blurb: "Hands-on ML workshop",
    description:
      "A hands-on session exploring PyTorch fundamentals, tensors, and data visualization. Bring a laptop.",
    meta: "ECSW 1.355 · 09/03/26 · 6:00 PM",
    detailMeta: "Sep 3, 2026 · 6:00 PM · ECSW 1.355",
    tags: ["workshop", "learn"],
  },
  {
    id: "sponsor-mixer",
    title: "Sponsor Mixer",
    blurb: "Network with industry",
    description:
      "Meet our industry sponsors, hear what they're building, and make connections that matter.",
    meta: "TBD · 09/10/26 · 7:00 PM",
    detailMeta: "Sep 10, 2026 · 7:00 PM · TBD",
    tags: ["networking", "industry"],
  },
  {
    id: "aim-social",
    title: "AIM Social",
    blurb: "Meet your AIM cohort",
    description:
      "Meet your AIM cohort over food and good company before the program kicks into gear.",
    meta: "ECSW 1.315 · 09/17/26 · 6:00 PM",
    detailMeta: "Sep 17, 2026 · 6:00 PM · ECSW 1.315",
    tags: ["food", "social"],
  },
];

export function getEvent(id: string): EventRecord | undefined {
  return EVENTS.find((e) => e.id === id);
}
