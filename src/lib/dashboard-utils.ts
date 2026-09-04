import { prisma } from "./prisma";
import { TZDate } from "@date-fns/tz";

const TIMEZONE = "America/Chicago";

/** Helper to construct dates safely in Central Time */
function getCTDate(year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0): Date {
  return new TZDate(year, month, day, hours, minutes, seconds, TIMEZONE);
}

export function getCurrentSemesterDates() {
  const now = new TZDate(new Date(), TIMEZONE);
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (month >= 7) { // Aug-Dec (Fall)
    return { start: getCTDate(year, 7, 1), end: getCTDate(year, 11, 31, 23, 59, 59) };
  } else if (month >= 0 && month <= 4) { // Jan-May (Spring)
    return { start: getCTDate(year, 0, 1), end: getCTDate(year, 4, 31, 23, 59, 59) };
  } else { // Jun-Jul (Summer)
    return { start: getCTDate(year, 5, 1), end: getCTDate(year, 6, 31, 23, 59, 59) };
  }
}

export function getPastSemesterDates() {
  const now = new TZDate(new Date(), TIMEZONE);
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month >= 7) { // Fall -> Past is Spring
    return { start: getCTDate(year, 0, 1), end: getCTDate(year, 4, 31, 23, 59, 59) };
  } else if (month >= 0 && month <= 4) { // Spring -> Past is Fall prev year
    return { start: getCTDate(year - 1, 7, 1), end: getCTDate(year - 1, 11, 31, 23, 59, 59) };
  } else { // Summer -> Past is Spring
    return { start: getCTDate(year, 0, 1), end: getCTDate(year, 4, 31, 23, 59, 59) };
  }
}

export async function getDashboardStats(id: string) {
  const currentSem = getCurrentSemesterDates();
  const pastSem = getPastSemesterDates();

  const [allTime, currentSemCount, pastSemCount] = await Promise.all([
    prisma.attendance.count({ where: { rsvp: { id } } }),
    prisma.attendance.count({
      where: { rsvp: { id }, checkedInAt: { gte: currentSem.start, lte: currentSem.end } },
    }),
    prisma.attendance.count({
      where: { rsvp: { id }, checkedInAt: { gte: pastSem.start, lte: pastSem.end } },
    }),
  ]);

  return { allTime, currentSemCount, pastSemCount };
}

export async function getProfileCompletion(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return { percent: 0, missingFields: ["Profile not created"] };

  const optionalFields = [
    { key: "linkedinUrl", label: "LinkedIn" },
    { key: "githubUrl", label: "GitHub" },
    { key: "year", label: "Year" },
    { key: "degree", label: "Degree" },
    { key: "major", label: "Major" },
  ] as const;

  let filled = 0;
  const missingFields: string[] = [];

  for (const field of optionalFields) {
    if (profile[field.key as keyof typeof profile]) {
      filled++;
    } else {
      missingFields.push(field.label);
    }
  }

  const percent = 50 + Math.round((filled / optionalFields.length) * 50);
  return { percent, missingFields };
}

/** Every active program, newest first — a member can hold more than one. */
export async function getMemberships(userId: string) {
  return prisma.membership.findMany({
    where: { userId, activeFlag: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplications(userId: string) {
  return prisma.applicationSubmission.findMany({
    where: { userId },
    include: { application: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getRSVPs(userId: string, take: number = 5) {
  return prisma.rSVP.findMany({
    where: { userId, status: "GOING" },
    include: {
      event: true,
      attendance: true,
    },
    orderBy: {
      event: {
        startTime: "desc",
      },
    },
    take,
  });
}

export async function getUpcomingEvents(take: number = 2, userId?: string) {
  const events = await prisma.event.findMany({
    where: { 
      status: "UPCOMING",
      isRsvpOpen: true,
      ...(userId ? {
        rsvps: {
          none: { 
            userId,
            status: "GOING" 
          }
        }
      } : {})
    },
  });
  
  return events.sort(() => 0.5 - Math.random()).slice(0, take);
}

export function formatDaysAway(date: Date) {
  const now = new TZDate(new Date(), TIMEZONE);
  const target = new TZDate(date, TIMEZONE);

  const hourDiff = (target.getTime() - now.getTime()) / (1000 * 3600);
  if (hourDiff < 0 && hourDiff >= -12) return "now";

  const startOfToday = getCTDate(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = getCTDate(target.getFullYear(), target.getMonth(), target.getDate());

  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) return "recently";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays} days`;
}

export function formatEventDate(date: Date) {
  return date.toLocaleString('en-US', { 
    timeZone: 'America/Chicago', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit' 
  });
}

export async function getNextUpcomingRsvp(userId: string) {
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  const liveRsvp = await prisma.rSVP.findFirst({
    where: {
      userId,
      status: "GOING",
      event: {
        startTime: { lte: now },
        endTime: { gte: now }
      }
    },
    include: { event: true }
  });

  if (liveRsvp) return { ...liveRsvp, isLive: true };

  const upcomingRsvp = await prisma.rSVP.findFirst({
    where: { 
      userId, 
      status: "GOING", 
      event: { startTime: { gte: twelveHoursAgo } } 
    },
    include: { event: true },
    orderBy: { event: { startTime: "asc" } },
  });

  if (upcomingRsvp) return { ...upcomingRsvp, isLive: false };

  const upcomingStatusRsvp = await prisma.rSVP.findFirst({
    where: { 
      userId, 
      status: "GOING", 
      event: { status: "UPCOMING" } 
    },
    include: { event: true },
    orderBy: { event: { startTime: "asc" } },
  });

  if (upcomingStatusRsvp) return { ...upcomingStatusRsvp, isLive: false };

  const historicalRsvp = await prisma.rSVP.findFirst({
    where: { userId, status: "GOING" },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  return historicalRsvp ? { ...historicalRsvp, isLive: false } : null;
}