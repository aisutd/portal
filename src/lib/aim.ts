import { prisma } from "@/lib/prisma";
import { generateQRToken } from "@/lib/qrToken";

// TODO(aim backend): the 10-week timeline is mock content for now (matching
// the "mock data first" call made for Academy) — swap for a real, admin-
// editable milestone model once the hub page's shape is approved. Meetings
// and attendance are already real: a weekly meeting is just an Event scoped
// to AIM_MENTOR/AIM_MENTEE visibility (see event-visibility.ts), and
// attendance reuses the existing RSVP/Attendance/QR-scan infrastructure.

export const AIM_TOTAL_WEEKS = 10;
/** Monday of week 1. Update each semester until this has a real admin UI. */
export const AIM_SEMESTER_START = new Date("2026-08-31T00:00:00-05:00");
export const AIM_SEMESTER_LABEL = "Fall 2026";

export function getCurrentAimWeek(): number {
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const elapsed = Date.now() - AIM_SEMESTER_START.getTime();
  const week = Math.floor(elapsed / msPerWeek) + 1;
  return Math.min(Math.max(week, 1), AIM_TOTAL_WEEKS);
}

export type AimTimelineStatus = "done" | "in-progress" | "upcoming";

export type AimMilestone = {
  weekLabel: string;
  weekStart: number;
  weekEnd: number;
  title: string;
  description: string;
  dueLabel: string;
};

export const AIM_TIMELINE: AimMilestone[] = [
  { weekLabel: "Wk 1", weekStart: 1, weekEnd: 1, title: "Kickoff & teams", description: "Team formed, idea chosen", dueLabel: "Due Sep 9" },
  { weekLabel: "Wk 2", weekStart: 2, weekEnd: 2, title: "Proposal", description: "Approved by your mentor", dueLabel: "Due Sep 16" },
  { weekLabel: "Wk 3-4", weekStart: 3, weekEnd: 4, title: "Setup & research", description: "Environment running, research done", dueLabel: "Due Sep 30" },
  { weekLabel: "Wk 5-6", weekStart: 5, weekEnd: 6, title: "Prototype", description: "Runs end to end", dueLabel: "Due Oct 14" },
  { weekLabel: "Wk 7-8", weekStart: 7, weekEnd: 8, title: "Build & evaluate", description: "Core features working, results measured", dueLabel: "Due Oct 28" },
  { weekLabel: "Wk 9", weekStart: 9, weekEnd: 9, title: "Polish", description: "README, demo, slides", dueLabel: "Due Nov 4" },
  { weekLabel: "Wk 10", weekStart: 10, weekEnd: 10, title: "Showcase", description: "Present to the society", dueLabel: "Due Nov 11" },
];

export function getMilestoneStatus(milestone: AimMilestone, currentWeek: number): AimTimelineStatus {
  if (currentWeek > milestone.weekEnd) return "done";
  if (currentWeek >= milestone.weekStart) return "in-progress";
  return "upcoming";
}

/** The nearest AIM-scoped meeting — soonest upcoming, else the most recent past one. */
export async function getNextAimEvent() {
  const now = new Date();

  const upcoming = await prisma.event.findFirst({
    where: {
      visibilityMembership: { hasSome: ["AIM_MENTOR", "AIM_MENTEE"] },
      isPublished: true,
      endTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
  });
  if (upcoming) return upcoming;

  return prisma.event.findFirst({
    where: {
      visibilityMembership: { hasSome: ["AIM_MENTOR", "AIM_MENTEE"] },
      isPublished: true,
    },
    orderBy: { startTime: "desc" },
  });
}

/**
 * AIM meetings are mandatory, not opt-in like a general event RSVP — so the
 * hub auto-RSVPs the viewer rather than making them click "RSVP" before they
 * can get a check-in code. Mirrors the upsert in api/events/[id]/rsvp/route.ts
 * minus the confirmation email, which doesn't make sense for an automatic
 * weekly RSVP.
 */
export async function ensureAimRsvp(userId: string, eventId: string) {
  const existing = await prisma.rSVP.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (existing?.status === "GOING") return existing;

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const qrToken = await generateQRToken({
    userId,
    eventId,
    ttl: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    nonce: `${userId}:${eventId}:${Date.now()}`,
  });

  const rsvpData = {
    status: "GOING" as const,
    qrToken,
    qrPayload: JSON.stringify({ userId, eventId, token: qrToken, expiresAt: expiresAt.toISOString() }),
    qrExpiresAt: expiresAt,
  };

  return prisma.rSVP.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: rsvpData,
    create: { userId, eventId, ...rsvpData },
  });
}
