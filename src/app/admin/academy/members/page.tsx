export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { AdminAcademyShell } from "@/components/admin/academy-shell";
import { AcademyTabs } from "@/components/admin/academy-tabs";
import { StatCard } from "@/components/admin/stat-card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "AIS Admin — Academy Members",
  description: "View and manage active AI Academy members and attendance analytics.",
};

export default async function AcademyMembersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const totalWorkshops = await prisma.workshop.count({
    where: { isPublished: true },
  });

  const academyUsers = await prisma.user.findMany({
    where: {
      memberships: {
        some: {
          membershipType: "AI_ACADEMY",
          activeFlag: true,
        },
      },
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              {
                profile: {
                  OR: [
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    },
    include: {
      profile: true,
      attendances: {
        where: {
          workshopId: { not: null },
        },
        select: {
          id: true,
          method: true,
        },
      },
      quizAttempts: {
        where: { passed: true },
        select: { id: true },
      },
    },
    orderBy: { email: "asc" },
  });

  const activeCount = academyUsers.length;
  const avgAttendance =
    activeCount > 0 && totalWorkshops > 0
      ? Math.round(
          (academyUsers.reduce((sum, u) => sum + u.attendances.length, 0) /
            (activeCount * totalWorkshops)) *
            100
        )
      : 0;

  const totalQuizzesPassed = academyUsers.reduce(
    (sum, u) => sum + u.quizAttempts.length,
    0
  );

  return (
    <AdminAcademyShell>
      <AcademyTabs active="Members" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
            Academy Members
          </h2>
          <p className="style-caption text-ink-faint mt-1">
            Showing active members across {totalWorkshops} published workshops.
          </p>
        </div>

        <form method="GET" className="w-full sm:w-80">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search member by name or email..."
            className="w-full rounded-[10px] border border-border-soft bg-white px-3.5 py-2 style-caption text-ink outline-none focus:border-brand"
          />
        </form>
      </div>

      {/* Analytics Row */}
      <div className="grid w-full grid-cols-2 gap-[12px] lg:flex lg:gap-[16px]">
        <StatCard value={String(activeCount)} label="active members" />
        <StatCard value={String(totalWorkshops)} label="total workshops" />
        <StatCard value={`${avgAttendance}%`} label="avg attendance rate" />
        <StatCard
          value={String(totalQuizzesPassed)}
          label="quizzes passed"
          highlight={true}
        />
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-[16px] border border-border-soft bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left style-caption text-ink">
            <thead className="border-b border-border-soft bg-cream/50 uppercase text-ink-faint">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Member</th>
                <th className="px-5 py-3.5 font-semibold">Workshops Attended</th>
                <th className="px-5 py-3.5 font-semibold">Attendance Rate</th>
                <th className="px-5 py-3.5 font-semibold">Quizzes Passed</th>
                <th className="px-5 py-3.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {academyUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-ink-faint"
                  >
                    No active AI Academy members found.
                  </td>
                </tr>
              ) : (
                academyUsers.map((user) => {
                  const fullName = user.profile
                    ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
                    : user.email;

                  const attendedCount = user.attendances.length;
                  const quizCount = user.quizAttempts.length;
                  const attendanceRate =
                    totalWorkshops > 0
                      ? Math.round((attendedCount / totalWorkshops) * 100)
                      : 0;

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-cream/30"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-ink">{fullName}</div>
                        <div className="text-ink-faint">{user.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-ink">
                          {attendedCount}
                        </span>
                        <span className="text-ink-faint"> / {totalWorkshops}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-border-soft/40">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{
                                width: `${Math.min(attendanceRate, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="font-semibold text-ink">
                            {attendanceRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 font-semibold text-purple-700">
                          {quizCount} Passed
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/academy/members/${user.id}`}
                          className="font-semibold text-brand hover:underline"
                        >
                          View Profile →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminAcademyShell>
  );
}
