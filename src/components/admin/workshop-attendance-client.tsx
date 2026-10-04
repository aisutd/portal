"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { checkInUserLive } from "@/app/admin/academy/workshops/[id]/attendance/actions";

export type AcademyMemberAttendance = {
  userId: string;
  name: string;
  email: string;
  membershipStatus: string;
  hasAttended: boolean;
  checkedInAt: Date | null;
  method: "QUIZ" | "MANUAL" | "QR_SCAN" | "OFFICER_TICKET_SCAN" | null;
  quizAttempt?: {
    score: number;
    passed: boolean;
    completedAt: Date;
    answersCount: number;
  } | null;
};

type Props = {
  workshopId: string;
  workshopTitle: string;
  members: AcademyMemberAttendance[];
  canCheckIn: boolean;
};

export function WorkshopAttendanceClient({
  workshopId,
  workshopTitle,
  members,
  canCheckIn,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "QUIZ" | "LIVE" | "ABSENT">("ALL");
  const [selectedMember, setSelectedMember] = useState<AcademyMemberAttendance | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter members by Search & Tab
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "QUIZ") return m.method === "QUIZ";
    if (activeTab === "LIVE") return m.method === "MANUAL" || m.method === "QR_SCAN";
    if (activeTab === "ABSENT") return !m.hasAttended;
    return true;
  });

  const liveCount = members.filter((m) => m.method === "MANUAL" || m.method === "QR_SCAN").length;
  const quizCount = members.filter((m) => m.method === "QUIZ").length;
  const totalAttended = liveCount + quizCount;

  const handleLiveCheckIn = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const res = await checkInUserLive(workshopId, userId);
      if (!res.success) {
        alert(res.error || "Check-in failed");
      }
    });
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/academy/workshops"
            className="text-xs font-semibold text-brand tracking-wide hover:underline"
          >
            ← Back to Workshops
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
            Attendance: {workshopTitle}
          </h1>
        </div>

        {canCheckIn && (
          <Link href={`/admin/academy/workshops/${workshopId}/scan`}>
            <Button variant="primary" size="sm" className="rounded-lg">
              Scanner
            </Button>
          </Link>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border-soft bg-white p-4 shadow-2xs">
          <p className="text-xs font-medium text-ink-faint">Active AI Academy Members</p>
          <p className="mt-1 text-2xl font-bold text-ink">{members.length}</p>
        </div>
        <div className="rounded-xl border border-border-soft bg-white p-4 shadow-2xs">
          <p className="text-xs font-medium text-ink-faint">Total Attended</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {totalAttended} <span className="text-xs text-ink-faint">({Math.round((totalAttended / (members.length || 1)) * 100)}%)</span>
          </p>
        </div>
        <div className="rounded-xl border border-border-soft bg-white p-4 shadow-2xs">
          <p className="text-xs font-medium text-ink-faint">Live Check-Ins</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{liveCount}</p>
        </div>
        <div className="rounded-xl border border-border-soft bg-white p-4 shadow-2xs">
          <p className="text-xs font-medium text-ink-faint">Quiz Completions</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">{quizCount}</p>
        </div>
      </div>

      {/* Controls: Search + Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border-soft bg-slate-50/50 p-1">
          {(["ALL", "LIVE", "QUIZ", "ABSENT"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-white text-ink shadow-2xs"
                  : "text-ink-faint hover:text-ink"
              }`}
            >
              {tab === "ALL" && `All (${members.length})`}
              {tab === "LIVE" && `Live Scan (${liveCount})`}
              {tab === "QUIZ" && `Quiz (${quizCount})`}
              {tab === "ABSENT" && `Absent (${members.length - totalAttended})`}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 rounded-lg border border-border-soft bg-white px-3 py-1.5 text-sm text-ink outline-hidden focus:border-brand"
        />
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-ink">
            <thead className="border-b border-border-soft bg-slate-50/50 text-xs uppercase text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Attendance Method</th>
                <th className="px-5 py-3 font-semibold">Time Recorded</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-faint">
                    No members match your criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.userId}
                    onClick={() => member.quizAttempt && setSelectedMember(member)}
                    className={`transition-colors ${
                      member.quizAttempt
                        ? "cursor-pointer hover:bg-purple-50/30"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-ink">{member.name}</div>
                      <div className="text-xs text-ink-faint">{member.email}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      {member.hasAttended ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          Attended
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                          Not Attended
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {member.method === "QUIZ" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-2 py-0.5">
                            Quiz Passed (Click to view)
                        </span>
                      )}
                      {(member.method === "MANUAL" || member.method === "QR_SCAN") && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5">
                            Live Check-In
                        </span>
                      )}
                      {!member.method && (
                        <span className="text-xs text-ink-faint">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-ink-faint">
                      {member.checkedInAt
                        ? new Date(member.checkedInAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {!member.hasAttended && canCheckIn && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={(e) => handleLiveCheckIn(member.userId, e)}
                          className="rounded-lg border border-border-soft hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          Check-In Live
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quiz Completion Detail Modal */}
      {selectedMember && selectedMember.quizAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-border-soft flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">Quiz Completion Details</h3>
                <p className="text-xs text-ink-faint">{selectedMember.name} ({selectedMember.email})</p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-ink-faint hover:text-ink font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 border border-border-soft text-sm">
              <div className="flex justify-between">
                <span className="text-ink-faint">Quiz Result:</span>
                <span className="font-bold text-emerald-600">PASSED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-faint">Score:</span>
                <span className="font-semibold text-ink">{selectedMember.quizAttempt.score}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-faint">Submitted On:</span>
                <span className="text-ink">
                  {new Date(selectedMember.quizAttempt.completedAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg"
                onClick={() => setSelectedMember(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}