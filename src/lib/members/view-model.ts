import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { semesterStart, startOfMonth } from "@/lib/semester";
import type { Member } from "@/components/admin/members-table";
import type { StatCardData } from "@/components/admin/stat-card";
import { ROLE_BADGES, STATUS_BADGES } from "./badges";
import { deriveRoleKey } from "./role";
import { deriveStatusKey } from "./status";
import { PAGE_SIZE, type MembersQuery } from "./query-params";

const OFFICER_ROLES: UserRole[] = ["REVIEWER", "ORGANIZER", "SUPER_ADMIN"];

const JOINED_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
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
    where.role = { in: OFFICER_ROLES };
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
    prisma.user.count({ where: { role: { in: OFFICER_ROLES } } }),
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
      memberships: { where: { activeFlag: true }, take: 1 },
    },
  });

  // Attendance only for the rows actually on screen.
  const userIds = users.map((user) => user.id);
  const attendedRsvps = userIds.length
    ? await prisma.rSVP.findMany({
        where: { userId: { in: userIds }, attendance: { isNot: null } },
        select: { userId: true, attendance: { select: { checkedInAt: true } } },
      })
    : [];

  const checkInsByUser = new Map<string, Date[]>();
  for (const rsvp of attendedRsvps) {
    if (!rsvp.attendance) continue;
    const existing = checkInsByUser.get(rsvp.userId) ?? [];
    existing.push(rsvp.attendance.checkedInAt);
    checkInsByUser.set(rsvp.userId, existing);
  }

  const rows: Member[] = users.map((user) => {
    const checkIns = checkInsByUser.get(user.id) ?? [];
    const membershipType = user.memberships[0]?.membershipType ?? null;

    return {
      id: user.id,
      name: displayName(user.profile, user.email),
      netid: user.profile?.utdNetId ?? "—",
      role: ROLE_BADGES[deriveRoleKey(user.role, membershipType)],
      events: String(checkIns.length),
      joined: JOINED_FORMAT.format(user.createdAt),
      status: STATUS_BADGES[deriveStatusKey(checkIns, semStart)],
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
