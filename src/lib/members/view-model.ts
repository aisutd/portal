import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { semesterStart, startOfMonth } from "@/lib/semester";
import type { Member } from "@/components/admin/members-table";
import type { StatCardData } from "@/components/admin/stat-card";
import { ADMIN_ROLES } from "@/lib/roles";
import { STATUS_BADGES } from "./badges";
import { roleBadges } from "./role";
import { deriveStatusKey, eventsNeededForActive } from "./status";
import { PAGE_SIZE, type MembersQuery } from "./query-params";

const JOINED_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

const EVENT_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export type MembersViewModel = {
  rows: Member[];
  stats: StatCardData[];
  total: number;
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
};

function buildWhere(query: MembersQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (query.q) {
    const contains = { contains: query.q, mode: "insensitive" as const };
    where.OR = [
      { email: contains },
      { profile: { is: { utdNetId: contains } } },
      { profile: { is: { firstName: contains } } },
      { profile: { is: { lastName: contains } } },
    ];
  }

  if (query.filter === "officers") {
    where.role = { in: [...ADMIN_ROLES] };
  } else if (query.filter === "mentors") {
    where.memberships = { some: { activeFlag: true, membershipType: "AIM_MENTOR" } };
  } else if (query.filter === "mentees") {
    where.memberships = { some: { activeFlag: true, membershipType: "AIM_MENTEE" } };
  }

  return where;
}

function buildOrderBy(sort: MembersQuery["sort"]): Prisma.UserOrderByWithRelationInput {
  if (sort === "recent") return { createdAt: "desc" };
  return { profile: { lastName: sort === "za" ? "desc" : "asc" } };
}

/** Members without a Profile row still need a name in the table. */
function displayName(
  profile: { prefName: string | null ; firstName: string; lastName: string } | null,
  email: string
): string {
  if (!profile) return email.split("@")[0];
  const given = profile.prefName || profile.firstName;
  return `${given} ${profile.lastName}`.trim() || email.split("@")[0];
}

export async function getMembersViewModel(query: MembersQuery): Promise<MembersViewModel> {
  const where = buildWhere(query);
  const semStart = semesterStart();

  // `total` is the filtered count driving pagination; `totalMembers` is the
  // unfiltered stat card. They differ whenever a filter is active.
  const [total, totalMembers, officerCount, activeUsers, newThisMonth] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count(),
    prisma.user.count({ where: { role: { in: [...ADMIN_ROLES] } } }),
    prisma.rSVP.findMany({
      where: { attendance: { is: { checkedInAt: { gte: semStart } } } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth() } } }),
  ]);

  // Clamp the page so a stale or hand-edited ?page= never renders an empty table.
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), pageCount);

  const users = await prisma.user.findMany({
    where,
    orderBy: buildOrderBy(query.sort),
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      profile: true,
      memberships: { where: { activeFlag: true }, select: { membershipType: true } },
    },
  });

  // Attendance only for the rows actually on screen.
  const userIds = users.map((user) => user.id);
  const [attendedRsvps, countableEvents] = await Promise.all([
    userIds.length
      ? prisma.rSVP.findMany({
          where: { userId: { in: userIds }, attendance: { isNot: null } },
          select: { userId: true, eventId: true },
        })
      : [],
    // Events a member could have attended: published, this semester, and
    // already over. An upcoming event must not count against anyone.
    prisma.event.findMany({
      where: { isPublished: true, endTime: { gte: semStart, lte: new Date() } },
      select: { id: true, title: true, endTime: true, programs: true },
      orderBy: { endTime: "desc" },
    }),
  ]);

  const attendedByUser = new Map<string, Set<string>>();
  for (const rsvp of attendedRsvps) {
    const existing = attendedByUser.get(rsvp.userId) ?? new Set<string>();
    existing.add(rsvp.eventId);
    attendedByUser.set(rsvp.userId, existing);
  }

  const rows: Member[] = users.map((user) => {
    const programs = user.memberships.map((m) => m.membershipType);
    const attendedIds = attendedByUser.get(user.id) ?? new Set<string>();

    // An untagged event is a general one and counts for every member.
    const applicable = countableEvents.filter(
      (event) =>
        event.programs.length === 0 ||
        event.programs.some((program) => programs.includes(program))
    );
    const attended = applicable.filter((event) => attendedIds.has(event.id)).length;
    const statusKey = deriveStatusKey(attended, applicable.length);

    return {
      id: user.id,
      name: displayName(user.profile, user.email),
      netid: user.profile?.utdNetId ?? "—",
      userRole: user.role,
      programs,
      roles: roleBadges(user.role, programs),
      events: applicable.length ? `${attended}/${applicable.length}` : String(attended),
      joined: JOINED_FORMAT.format(user.createdAt),
      status: STATUS_BADGES[statusKey],
      statusDetail: {
        statusKey,
        attended,
        countable: applicable.length,
        needed: eventsNeededForActive(attended, applicable.length),
        programs,
        events: applicable.map((event) => ({
          id: event.id,
          title: event.title,
          date: EVENT_DATE_FORMAT.format(event.endTime),
          general: event.programs.length === 0,
          attended: attendedIds.has(event.id),
        })),
      },
    };
  });

  const stats: StatCardData[] = [
    { value: String(totalMembers), label: "total members" },
    { value: String(officerCount), label: "officers" },
    { value: String(activeUsers.length), label: "active this sem" },
    { value: String(newThisMonth), label: "new this month", highlight: true },
  ];

  return {
    rows,
    stats,
    total,
    page,
    pageCount,
    rangeStart: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    rangeEnd: Math.min(page * PAGE_SIZE, total),
  };
}

export async function getMemberById(id: string): Promise<Member | null> {
  const semStart = semesterStart();

  // 1. Fetch the user, profile, and active memberships
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      memberships: { 
        where: { activeFlag: true }, 
        select: { membershipType: true } 
      },
    },
  });

  if (!user) return null;

  // 2. Fetch attendance and countable events in parallel
  const [attendedRsvps, countableEvents] = await Promise.all([
    prisma.rSVP.findMany({
      where: { userId: id, attendance: { isNot: null } },
      select: { eventId: true },
    }),
    prisma.event.findMany({
      where: { isPublished: true, endTime: { gte: semStart, lte: new Date() } },
      select: { id: true, title: true, endTime: true, programs: true },
      orderBy: { endTime: "desc" },
    }),
  ]);

  const attendedIds = new Set(attendedRsvps.map((rsvp) => rsvp.eventId));
  const programs = user.memberships.map((m) => m.membershipType);

  // 3. Filter countable events to only those applicable to this member
  // (An event is applicable if it's untagged, or if it matches one of their programs)
  const applicable = countableEvents.filter(
    (event) =>
      event.programs.length === 0 ||
      event.programs.some((program) => programs.includes(program))
  );
  
  const attendedCount = applicable.filter((event) => attendedIds.has(event.id)).length;
  const statusKey = deriveStatusKey(attendedCount, applicable.length);

  // 4. Map everything exactly to your `Member` type
  return {
    id: user.id,
    name: displayName(user.profile, user.email),
    netid: user.profile?.utdNetId ?? "—",
    userRole: user.role,
    programs,
    roles: roleBadges(user.role, programs),
    events: applicable.length ? `${attendedCount}/${applicable.length}` : String(attendedCount),
    joined: JOINED_FORMAT.format(user.createdAt),
    status: STATUS_BADGES[statusKey],
    statusDetail: {
      statusKey,
      attended: attendedCount,
      countable: applicable.length,
      needed: eventsNeededForActive(attendedCount, applicable.length),
      programs,
      events: applicable.map((event) => ({
        id: event.id,
        title: event.title,
        date: EVENT_DATE_FORMAT.format(event.endTime),
        general: event.programs.length === 0,
        attended: attendedIds.has(event.id),
      })),
    },
  };
}
