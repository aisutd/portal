import { prisma } from "./prisma";

// Semester definitions based on UTD calendar
// Fall: Aug 1 - Dec 31
// Spring: Jan 1 - May 31
// Summer: Jun 1 - Jul 31

export function getCurrentSemesterDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (month >= 7) { // Aug-Dec (Fall)
    return { start: new Date(year, 7, 1), end: new Date(year, 11, 31, 23, 59, 59) };
  } else if (month >= 0 && month <= 4) { // Jan-May (Spring)
    return { start: new Date(year, 0, 1), end: new Date(year, 4, 31, 23, 59, 59) };
  } else { // Jun-Jul (Summer)
    return { start: new Date(year, 5, 1), end: new Date(year, 6, 31, 23, 59, 59) };
  }
}

export function getPastSemesterDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month >= 7) { // Current is Fall, Past is Spring (skip summer for simplicity or include it?) 
    // Let's define past semester as the previous major semester. If Fall, past is Spring.
    return { start: new Date(year, 0, 1), end: new Date(year, 4, 31, 23, 59, 59) };
  } else if (month >= 0 && month <= 4) { // Current is Spring, Past is Fall of previous year
    return { start: new Date(year - 1, 7, 1), end: new Date(year - 1, 11, 31, 23, 59, 59) };
  } else { // Current is Summer, Past is Spring
    return { start: new Date(year, 0, 1), end: new Date(year, 4, 31, 23, 59, 59) };
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
    //{ key: "resumeFileId", label: "Resume" },
    { key: "year", label: "Year"},
    { key: "degree", label: "Degree"},
    { key: "major", label: "Major"},

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
  console.log(missingFields);

  // Base profile gives 40%. Optional fields give 10% each. -- with resumeFieldId
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
  });
}

export async function getUpcomingEvents(take: number = 2, userId?: string) {
  const events = await prisma.event.findMany({
    where: { 
      status: "UPCOMING",
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
  
  // Randomly shuffle the events and take the requested amount
  return events.sort(() => 0.5 - Math.random()).slice(0, take);
}

export function formatDaysAway(date: Date) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Calculate raw difference in milliseconds to check exact hour progress
  const hourDiff = (date.getTime() - now.getTime()) / (1000 * 3600);
  
  // If the event started in the past but within our 12-hour lookback window
  if (hourDiff < 0 && hourDiff >= -12) {
    return "now";
  }
  
  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) return "recently";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays} days`;
}

export function formatEventDate(date: Date) {
  return date.toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export async function getNextUpcomingRsvp(userId: string) {
  // 1. Get the current app server time
  const now = new Date();
  
  // 2. Shift the boundary forward by 5 hours to align with your database timezone context
  const dbNowAhead = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  
  // 3. Subtract your 12-hour lookback window from that shifted DB base time
  const twelveHoursAgoDB = new Date(dbNowAhead.getTime() - 12 * 60 * 60 * 1000);

  const liveRsvp = await prisma.rSVP.findFirst({
    where: {
      userId,
      status: "GOING",
      event: {
        startTime: { lte: dbNowAhead },
        endTime: { gte: dbNowAhead }
      }
    },
    include: { event: true }
  });

  // If a live event is found, inject a flag so the UI knows to render it differently
  if (liveRsvp) {
    return { ...liveRsvp, isLive: true };
  }
  // First attempt: Find an RSVP for an event matching the synchronized database time window
  const upcomingRsvp = await prisma.rSVP.findFirst({
    where: { 
      userId, 
      status: "GOING", 
      event: { startTime: { gte: twelveHoursAgoDB } } 
    },
    include: { event: true },
    orderBy: { event: { startTime: "asc" } }, // Earliest first
  });

  if (upcomingRsvp) return { ...upcomingRsvp, isLive: false };

  // Fallback via explicit UPCOMING status field
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

  // Last fallback (Historical)
  const historicalRsvp = await prisma.rSVP.findFirst({
    where: { userId, status: "GOING" },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  return historicalRsvp ? { ...historicalRsvp, isLive: false } : null;

}
