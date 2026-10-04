export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAcademyShell } from "@/components/admin/academy-shell";
import { AcademyTabs } from "@/components/admin/academy-tabs";
import { StatCard } from "@/components/admin/stat-card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "AIS Admin — Academy Member Profile",
  description: "View individual academy member attendance and quiz achievements.",
};

export default async function AcademyMemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      memberships: {
        where: { membershipType: "AI_ACADEMY" },
      },
    },
  });

  if (!user) return notFound();

  const workshops = await prisma.workshop.findMany({
    where: { isPublished: true },
    include: {
      quiz: true,
      attendances: {
        where: { userId },
      },
    },
    orderBy: { startTime: "desc" },
  });

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      passed: true,
    },
  });

  const memberName = user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
    : user.email;

  const totalAttended = workshops.filter((w) => w.attendances.length > 0).length;
  const attendanceRate =
    workshops.length > 0
      ? Math.round((totalAttended / workshops.length) * 100)
      : 0;

  const activeMembership = user.memberships.find((m) => m.activeFlag);

  return (
    <AdminAcademyShell>
      <AcademyTabs active="Members" />

      <div>
        <Link
          href="/admin/academy/members"
          className="style-caption font-semibold text-brand hover:underline"
        >
          ← Back to Academy Members
        </Link>
      </div>

      {/* Profile Card Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-[16px] border border-border-soft bg-white p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="style-section-header text-ink">{memberName}</h2>
            {activeMembership ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 style-caption font-semibold text-emerald-700">
                Active Member
              </span>
            ) : (
              <span className="rounded-full bg-cream px-2.5 py-0.5 style-caption font-semibold text-ink-faint">
                Inactive
              </span>
            )}
          </div>
          <p className="style-caption text-ink-faint mt-1">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 style-caption">
          {user.profile?.utdNetId && (
            <span className="rounded-[8px] border border-border-soft bg-cream px-3 py-1.5 font-medium text-ink">
              NetID: {user.profile.utdNetId}
            </span>
          )}
          {user.profile?.major && (
            <span className="rounded-[8px] border border-border-soft bg-cream px-3 py-1.5 font-medium text-ink">
              {user.profile.major}
            </span>
          )}
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid w-full grid-cols-2 gap-[12px] lg:flex lg:gap-[16px]">
        <StatCard
          value={`${totalAttended} / ${workshops.length}`}
          label="workshops attended"
        />
        <StatCard value={`${attendanceRate}%`} label="attendance rate" />
        <StatCard
          value={String(quizAttempts.length)}
          label="quizzes passed"
          highlight={true}
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="flex flex-col gap-[12px]">
        <h3 className="style-section-header text-ink">
          Workshop Attendance History
        </h3>
        <div className="overflow-x-auto rounded-[16px] border border-border-soft bg-white">
          <table className="w-full min-w-[720px] text-left style-caption text-ink">
            <thead className="border-b border-border-soft bg-cream/50 uppercase text-ink-faint">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Workshop</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Method</th>
                <th className="px-5 py-3.5 text-right font-semibold">
                  Checked In At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {workshops.map((workshop) => {
                const attendance = workshop.attendances[0];
                const quizAttempt = workshop.quiz
                  ? quizAttempts.find((q) => q.quizId === workshop.quiz?.id)
                  : null;

                return (
                  <tr
                    key={workshop.id}
                    className="transition-colors hover:bg-cream/30"
                  >
                    <td className="px-5 py-4 font-semibold text-ink">
                      <Link
                        href={`/admin/academy/workshops/${workshop.id}/check-in`}
                        className="hover:text-brand hover:underline"
                      >
                        {workshop.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-ink-faint">
                      {new Date(workshop.startTime).toLocaleDateString(
                        "en-US",
                        {
                          dateStyle: "medium",
                        }
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {attendance ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                          Attended
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-cream px-2.5 py-0.5 font-semibold text-ink-faint">
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {attendance?.method === "QUIZ" && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 font-semibold text-purple-700">
                          📝 Quiz Passed ({quizAttempt?.score ?? 100}%)
                        </span>
                      )}
                      {(attendance?.method === "MANUAL" ||
                        attendance?.method === "QR_SCAN" ||
                        attendance?.method === "OFFICER_TICKET_SCAN") && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                          🎟️ Live Scan
                        </span>
                      )}
                      {!attendance && "—"}
                    </td>
                    <td className="px-5 py-4 text-right text-ink-faint">
                      {attendance?.checkedInAt
                        ? new Date(attendance.checkedInAt).toLocaleString(
                            "en-US",
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }
                          )
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminAcademyShell>
  );
}
