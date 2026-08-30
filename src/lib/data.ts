import type { Stat } from "@/components/dashboard/status-strip";
import type { Achievement } from "@/components/dashboard/achievements-card";
import type { Announcement } from "@/components/dashboard/announcements-card";
import type { TagData } from "@/components/dashboard/up-next-card";
import type { Step } from "@/components/apply/step-card";
import type { Program } from "@/components/apply/program-card";
import type { Applicant } from "@/components/admin/applicant-list-item";
import type { ApplicantDetailData } from "@/components/admin/applicant-detail";
import type { SettingRow } from "@/components/admin/settings-card";
import type { StatCardData } from "@/components/admin/stat-card";
import type { Role } from "@/components/apply/role-card";
import type { FeaturedEvent } from "@/components/events/featured-event-card";
import type { SideEvent } from "@/components/events/side-event-card";
import type { MiniEvent } from "@/components/events/mini-event-card";
import type { PastTileData } from "@/components/events/past-tile";
import type { EventGridItem } from "@/components/events/event-grid-card";

export const statusStats: Stat[] = [
  { kind: "dot", label: "Membership", value: "Active", dotColor: "#356b2e" },
  {
    kind: "progress",
    label: "Events kept",
    value: "3 / 4",
    percent: 75,
    trackColor: "#e1e8ff",
    fillColor: "#2f5fe8",
  },
  {
    kind: "progress",
    label: "Profile complete",
    value: "80%",
    percent: 80,
    trackColor: "#fbe3cb",
    fillColor: "#f2a968",
  },
  { kind: "dot", label: "Discord", value: "Linked", dotColor: "#9f95c7" },
];

export const upNextTags: TagData[] = [
  { label: "social", bg: "#f6ecbb", color: "#766411" },
  { label: "food", bg: "#f9d5d3", color: "#9a3b36" },
  { label: "learn", bg: "#d3eccf", color: "#356b2e" },
];

// export const applications: ApplicationItem[] = [
//   {
//     title: "AIM Mentor · Fall 2026",
//     status: { variant: "solid", label: "Active", bg: "#e1e8ff", color: "#1f3aa3" },
//     percent: 70,
//     fillColor: "#2f5fe8",
//   },
//   {
//     title: "AIS Tech Officer",
//     status: { variant: "outline", label: "Draft" },
//     percent: 30,
//     fillColor: "#4f7bff",
//   },
// ];

// export const rsvps: RsvpItem[] = [
//   { day: "27", title: "Fall Kickoff", detail: "7:00 PM · ECSW 1.315" },
//   { day: "03", title: "Intro to PyTorch", detail: "6:00 PM · ECSW 1.355" },
//   { day: "17", title: "AIM Social", detail: "6:00 PM · ECSW 1.315" },
// ];

export const achievements: Achievement[] = [
  { value: "★", label: "RANK · NOVICE", bg: "#fbe3cb", color: "#7a4416" },
  { value: "3", label: "FALL 2026 EVENTS", bg: "#e9e5f6", color: "#4b4178" },
  { value: "4", label: "LIFETIME EVENTS", bg: "#e9e5f6", color: "#4b4178" },
];

// export const recommended: RecommendedItem[] = [
//   {
//     title: "Intro to PyTorch",
//     tags: [
//       { label: "workshop", bg: "#cde9e5", color: "#1d6a61" },
//       { label: "learn", bg: "#d3eccf", color: "#356b2e" },
//     ],
//   },
//   {
//     title: "Sponsor Mixer",
//     tags: [
//       { label: "networking", bg: "#d6e2ff", color: "#284b9c" },
//       { label: "industry", bg: "#ded9f4", color: "#463e86" },
//     ],
//   },
// ];

export const announcements: [Announcement, Announcement] = [
  {
    title: "Officer apps close June 1",
    body: "Last call to apply for the 2026–27 team.",
  },
  {
    title: "Kickoff moved to ECSW 1.315",
    body: "New room, same time — see you there.",
  },
];

/* ---------------------------------------------------------------- Apply page */

export const applySteps: Step[] = [
  {
    step: "STEP 1",
    title: "Pick a Program",
    description: "Find the path that matches your level and interests.",
    number: "1",
  },
  {
    step: "STEP 2",
    title: "Submit Application",
    description: "Fill out our quick enrollment forms and share your passion.",
    number: "2",
  },
  {
    step: "STEP 3",
    title: "Join the Hub",
    description: "Get onboarded and start meeting your fellow AIS members.",
    number: "3",
  },
];

export const programs: Program[] = [
  {
    icon: "◇",
    iconBg: "#3d6cfa",
    iconColor: "#1f3aa3",
    image: "/images/programs/ai-academy.png",
    borderColor: "#e7e2d4",
    title: "AI Academy",
    description:
      "Master the fundamentals of machine learning through our guided 10-week curriculum.",
    tags: ["Beginner", "Workshops", "10 weeks"],
    cta: "primary",
  },
  {
    icon: "◈",
    iconBg: "#7ed857",
    iconColor: "#7a4416",
    image: "/images/programs/aim.png",
    borderColor: "#f2a968",
    badge: "High demand",
    title: "AI Mentorship",
    description:
      "Get paired with senior students to accelerate your career in AI.",
    tags: ["Project", "Team-based", "Mentorship", "Industry"],
    cta: "accent",
  },
  {
    icon: "◆",
    iconBg: "#9c14dc",
    iconColor: "#4b4178",
    image: "/images/programs/innovation-lab.png",
    borderColor: "#e7e2d4",
    title: "Innovation Labs",
    description:
      "Selected teams deepen their AIM project in a lab/research setting, providing niche ML/AI experience.",
    tags: ["Advanced", "Team based", "Research"],
    cta: "primary",
  },
];

// export const openApps: OpenApp[] = [
//   {
//     title: "AIM Mentor Application · Fall 2026",
//     description: "Mentor students in building an AI/ML project",
//     meta: "closes June 25, 2026 · 11:59 PM CT",
//     borderColor: "#2f5fe8",
//     metaMedium: true,
//     actions: [
//       { label: "Learn more", variant: "soft" },
//       { label: "Apply", variant: "primary", href: "/applications/detail" },
//     ],
//   },
//   {
//     title: "AIS Tech Team Officer · 2026–2027",
//     description: "Design & develop AIS technical infrastructure",
//     meta: "closes June 1, 2026 · 11:59 PM CT",
//     borderColor: "#e7e2d4",
//     metaMedium: true,
//     actions: [
//       { label: "Learn more", variant: "ghost" },
//       { label: "Apply", variant: "primary", href: "/applications/detail" },
//     ],
//   },
//   {
//     title: "AI Academy Application · 2026–2027",
//     description: "AI workshops to help you build your 1ˢᵗ AI project",
//     meta: "opens May 25, 2026",
//     borderColor: "#e7e2d4",
//     dim: true,
//     actions: [
//       { label: "Learn more", variant: "ghost" },
//       { label: "Remind me", variant: "accent", pill: false },
//     ],
//   },
// ];

/* -------------------------------------------------------- Admin · Apply page */

export type StatPill = {
  label: string;
  bg?: string;
  color?: string;
  outline?: boolean;
};

export const reviewStats: StatPill[] = [
  { label: "37 received", bg: "#fbe3cb", color: "#7a4416" },
  { label: "12 to review", bg: "#e1e8ff", color: "#1f3aa3" },
  { label: "5 shortlisted", bg: "#e9e5f6", color: "#4b4178" },
  { label: "3 accepted", outline: true },
];

export type FilterChip = { label: string; active?: boolean };

export const reviewFilters: FilterChip[] = [
  { label: "All", active: true },
  { label: "New" },
  { label: "Shortlisted" },
  { label: "Reviewed" },
];

export const adminApplicants: Applicant[] = [
  { name: "Applicant A", meta: "aja210 · new", active: true },
  { name: "Applicant B", meta: "bxk190 · shortlisted", score: "4.5" },
  { name: "Applicant C", meta: "cmr204 · reviewed", score: "3.9" },
  { name: "Applicant D", meta: "dpl217 · new" },
];

export const applicantDetail: ApplicantDetailData = {
  name: "Applicant A",
  netid: "aja210",
  email: "aja210@utdallas.edu",
  phone: "(469) 555-0142",
  roleBadge: "Role: Mentor",
  statusBadge: "New",
  appliedAt: "applied Jun 3, 2026 · 2:31 PM",
  questions: [
    {
      prompt: "Why do you want to join AIM as a mentor?",
      lines: ["96%", "90%", "62%"],
    },
    {
      prompt: "What project idea do you propose?",
      lines: ["94%", "88%", "54%"],
    },
  ],
  rubric: [
    { label: "Fit for AIM", selected: 4 },
    { label: "Technical ability", selected: 4 },
    { label: "Project idea", selected: 5 },
    { label: "Communication", selected: 4 },
  ],
  overall: "4.2 / 5",
  reviewers: [
    {
      name: "Reviewer 1 · you",
      score: "4.2",
      tone: "brand",
      comment: "strong project idea, good fit for mentoring",
    },
    {
      name: "Reviewer 2 · Ashwin",
      score: "3.8",
      tone: "purple",
      comment: "solid, wants more ML depth in proposal",
    },
  ],
  combinedAvg: "4.0",
};

/* ---------------------------------------------------- Admin · Create Event */

export const eventTags: TagData[] = [
  { label: "food", bg: "#f9d5d3", color: "#9a3b36" },
  { label: "drink", bg: "#fbe3c6", color: "#8a4e18" },
  { label: "social", bg: "#f6ecbb", color: "#766411" },
  { label: "learn", bg: "#d3eccf", color: "#356b2e" },
  { label: "workshop", bg: "#cde9e5", color: "#1d6a61" },
  { label: "networking", bg: "#d6e2ff", color: "#284b9c" },
  { label: "industry", bg: "#ded9f4", color: "#463e86" },
];

export const eventSettings: SettingRow[] = [
  { label: "Require check-in QR", type: "toggle", on: true },
  { label: "Members only", type: "toggle", on: false },
  { label: "Visibility", type: "badge", badge: "Draft" },
];

/* --------------------------------------------------------- Admin · Overview */

export const overviewStatsPrimary: StatCardData[] = [
  { value: "36", label: "Apps received", highlight: true },
  { value: "14", label: "Apps need review" },
  { value: "2", label: "Apps open" },
  { value: "10", label: "Events this sem" },
];

export const overviewStatsSecondary: StatCardData[] = [
  { value: "109", label: "Members" },
  { value: "28", label: "Officers" },
];

/** Skeleton bar widths (% of card) for the Recent activity placeholder. */
export const recentActivityWidths = ["88%", "74%", "80%", "62%"];

// /* ----------------------------------------------------------- Admin · Events */

// export const eventStats: StatCardData[] = [
//   { value: "3", label: "upcoming" },
//   { value: "128", label: "total RSVPs" },
//   { value: "86", label: "checked in" },
//   { value: "92%", label: "avg capacity", highlight: true },
// ];

// const STATUS_LIVE = { label: "Live", bg: "#d2ecd9", color: "#2c5d3e" };
// const STATUS_DRAFT = { label: "Draft", bg: "#efece3", color: "#6a685f" };
// const STATUS_PAST = { label: "Past", bg: "#efece3", color: "#8a8a93" };

// const FILL_BRAND = "#2f5fe8";
// const FILL_GREY = "#8a8a93";

// export const adminEvents: EventRowData[] = [
//   {
//     title: "Fall Kickoff",
//     status: STATUS_LIVE,
//     meta: "Aug 27 · 7:00 PM · ECSW 1.315",
//     leftInfo: "86 / 150 checked in",
//     rightInfo: "128 RSVPs",
//     progress: 57,
//     progressFill: FILL_BRAND,
//     actions: [
//       { label: "Edit", variant: "ghost" },
//       { label: "Scan", variant: "primary" },
//     ],
//   },
//   {
//     title: "Intro to PyTorch",
//     status: STATUS_LIVE,
//     meta: "Sep 3 · 6:00 PM · ECSW 1.355",
//     leftInfo: "12 / 40 checked in",
//     rightInfo: "31 RSVPs",
//     progress: 30,
//     progressFill: FILL_BRAND,
//     actions: [
//       { label: "Edit", variant: "ghost" },
//       { label: "Scan", variant: "primary" },
//     ],
//   },
//   {
//     title: "Sponsor Mixer",
//     status: STATUS_DRAFT,
//     meta: "Sep 10 · 7:00 PM · TBD",
//     leftInfo: "not published",
//     rightInfo: "cap 60",
//     progress: 0,
//     progressFill: FILL_BRAND,
//     actions: [
//       { label: "Edit", variant: "ghost" },
//       { label: "Publish", variant: "accent", pill: false },
//     ],
//   },
//   {
//     title: "AIM Social",
//     status: STATUS_PAST,
//     meta: "May 26 · 6:00 PM · ECSW 1.315",
//     leftInfo: "48 / 50 attended",
//     rightInfo: "export CSV ↗",
//     progress: 96,
//     progressFill: FILL_GREY,
//     dim: true,
//     actions: [{ label: "View", variant: "ghost" }],
//   },
// ];

/* -------------------------------------------------------- Apply · Form (step) */

/**
 * The fixed first step of the applicant form. Everything after it comes from
 * the application's own questions — see `lib/application-form.ts`.
 */
export const personalFields = [
  "First Name",
  "Last Name",
  "NetID",
  "Phone Number",
  "Personal Email *",
  "UTD Email *",
  "Resume *",
  "LinkedIn *",
];

/* ------------------------------------------------------- Apply · Detail (roles) */

const techTag = (label: string): TagData => ({
  label,
  bg: "#e1e8ff",
  color: "#1f3aa3",
});
const neutralTag = (label: string): TagData => ({
  label,
  bg: "#efece3",
  color: "#6a685f",
  border: "#e2ded2",
});

export const applyDetail = {
  title: "AIS Tech Team Officer Application · 2026–2027",
  subtitle:
    "Design & develop AIS technical infrastructure · closes June 1, 2026",
};

export const applyDetailRoles: Role[] = [
  {
    title: "Designer — Web Design",
    description:
      "Create clean, creative, user-friendly designs. Work closely with the Marketing & Design team.",
    tagRows: [
      [techTag("Figma"), techTag("Tailwind")],
      [neutralTag("HTML"), neutralTag("CSS"), neutralTag("TypeScript")],
    ],
  },
  {
    title: "React Developer — Frontend / Backend",
    description:
      "Maintain existing software & build new AIS websites, including HackAI.",
    tagRows: [
      [techTag("Python"), techTag("Node.js")],
      [neutralTag("React")],
    ],
  },
];

/* --------------------------------------------------------------- Events page */

export const eventsHero = {
  title: "What's Happening",
  subtitle:
    "Your portal to the most energetic tech community at UTD. Dive into workshops, socials, and hackathons designed for the bold.",
};

export const featuredEvent: FeaturedEvent = {
  badge: "Featured · Monday",
  title: "AIS Kickoff Social",
  description:
    "Join us for pizza, games, and the big reveal for the semester. Don't miss out.",
  tags: [
    { label: "food", bg: "#f9d5d3", color: "#9a3b36" },
    { label: "social", bg: "#f6ecbb", color: "#766411" },
  ],
};

export const sideEvent: SideEvent = {
  date: "OCT 14 · 4:00 PM",
  title: "Python for ML Deep Dive",
  description: "A hands-on session exploring PyTorch and data visualization.",
  tag: { label: "learn", bg: "#d3eccf", color: "#356b2e" },
};

export const miniEvent: MiniEvent = {
  icon: "☕",
  date: "EVERY WED · 10AM",
  title: "Coffee & Code",
  description: "Casual networking at the Student Union.",
};

export const pastTiles: PastTileData[] = [
  { variant: "image", label: "AI STARTUP PANEL" },
  { variant: "image", label: "ML MIXER" },
  { variant: "stat", stat: "500+", label: "STUDENTS ATTENDED" },
  { variant: "image", label: "HACKAI 2025" },
];

/* ----------------------------------------------------- Events · Browse (grid) */

const TAG_PALETTE: Record<string, { bg: string; color: string }> = {
  food: { bg: "#f9d5d3", color: "#9a3b36" },
  drink: { bg: "#fbe3c6", color: "#8a4e18" },
  social: { bg: "#f6ecbb", color: "#766411" },
  learn: { bg: "#d3eccf", color: "#356b2e" },
  workshop: { bg: "#cde9e5", color: "#1d6a61" },
  networking: { bg: "#d6e2ff", color: "#284b9c" },
  industry: { bg: "#ded9f4", color: "#463e86" },
};

const tag = (label: keyof typeof TAG_PALETTE): TagData => ({
  label,
  ...TAG_PALETTE[label],
});

export const eventFilterTags: TagData[] = (
  Object.keys(TAG_PALETTE) as (keyof typeof TAG_PALETTE)[]
).map(tag);

export const browseEvents: EventGridItem[] = [
  {
    title: "Fall Kickoff",
    meta: "ECSW 2.412 · 08/27/26 · 7:00 PM",
    description: "Learn about & join AIS",
    tags: [tag("food"), tag("social")],
    eventId: "mock-event-upcoming",
  },
  {
    title: "Intro to PyTorch",
    meta: "ECSW 1.355 · 09/03/26 · 6:00 PM",
    description: "Hands-on ML workshop",
    tags: [tag("workshop"), tag("learn")],
    eventId: "mock-event-past",
  },
  {
    title: "Sponsor Mixer",
    meta: "TBD · 09/10/26 · 7:00 PM",
    description: "Network with industry",
    tags: [tag("networking"), tag("industry")],
    eventId: "mock-event-past",
  },
  {
    title: "AIM Social",
    meta: "ECSW 1.315 · 09/17/26 · 6:00 PM",
    description: "Meet your AIM cohort",
    tags: [tag("food"), tag("social")],
    eventId: "mock-event-upcoming",
  },
];
