export const dynamic = "force-dynamic";

import Image from "next/image";
import { redirect } from "next/navigation";
import QRCode from "react-qr-code";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AimGradientBackground } from "@/components/aim/gradient-background";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  AIM_SEMESTER_LABEL,
  AIM_TIMELINE,
  AIM_TOTAL_WEEKS,
  ensureAimRsvp,
  getCurrentAimWeek,
  getMilestoneStatus,
  getNextAimEvent,
} from "@/lib/aim";
import { formatEventDate } from "@/lib/utils";

const CARD = "rounded-[20px] border border-white/10 bg-[#161d3a]";

const STATUS_PILL: Record<string, string> = {
  done: "bg-[#22c55e] text-[#052e14]",
  "in-progress": "bg-[#3b82f6] text-white",
  upcoming: "bg-white/10 text-white/70",
};
const STATUS_LABEL: Record<string, string> = {
  done: "Done",
  "in-progress": "In progress",
  upcoming: "Upcoming",
};

export default async function AimHubPage() {
  const viewer = await getAuthenticatedUser();
  if (!viewer) redirect("/onboarding?mode=login");

  const activePrograms = viewer.memberships.filter((m) => m.activeFlag).map((m) => m.membershipType);
  const isAimMember = activePrograms.includes("AIM_MENTOR") || activePrograms.includes("AIM_MENTEE");
  const isAdminPreview = ["OFFICER", "DIRECTOR", "EXECUTIVE"].includes(viewer.role);
  if (!isAimMember && !isAdminPreview) {
    redirect("/dashboard?error=aim_access_required");
  }

  const currentWeek = getCurrentAimWeek();
  const nextEvent = await getNextAimEvent();
  const rsvp = nextEvent ? await ensureAimRsvp(viewer.id, nextEvent.id) : null;

  const lastWeek = AIM_TIMELINE.find((m) => getMilestoneStatus(m, currentWeek) === "done");
  const current = AIM_TIMELINE.find((m) => getMilestoneStatus(m, currentWeek) === "in-progress");

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <AimGradientBackground />
      <Navbar active="AIM" />

      <main className="relative mx-auto flex w-full max-w-[1300px] flex-1 flex-col gap-[28px] px-[24px] pb-[64px] pt-28 lg:px-[46px]">
        {/* Header */}
        <div className="flex flex-col items-start gap-[16px] lg:flex-row lg:items-center lg:justify-between">
          <Image
            src="/images/aim/wordmark.png"
            alt="AI Mentorship"
            width={597}
            height={418}
            className="h-[160px] w-auto object-contain lg:h-[240px]"
            priority
          />

          <div className="flex flex-col items-start gap-[10px] lg:items-end">
            <span className="rounded-full border border-[#22c55e]/50 bg-[#22c55e]/10 px-[14px] py-[6px] style-badge-text text-[#4ade80]">
              Week {currentWeek} of {AIM_TOTAL_WEEKS} · {AIM_SEMESTER_LABEL}
            </span>
            <h1 className="style-page-title uppercase tracking-wide text-white">Mentorship Hub</h1>
            {nextEvent && (
              <span className="rounded-full bg-[#22c55e] px-[14px] py-[6px] style-badge-text text-[#052e14]">
                Next meeting: {formatEventDate(nextEvent.startTime.toISOString(), true)} · {nextEvent.location}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[20px] lg:grid-cols-[320px_1fr]">
          {/* Check-in card */}
          <div className={`flex flex-col items-center gap-[16px] ${CARD} border-t-[4px] border-t-[#22c55e] p-[28px] text-center`}>
            <div className="flex flex-col items-center gap-[2px]">
              <span className="style-caption uppercase tracking-widest text-white/60">
                Attendance · Week {currentWeek}
              </span>
              <span className="style-card-title text-white">Check in</span>
            </div>

            <div className="flex items-center justify-center rounded-[16px] bg-white p-[16px]">
              {rsvp ? (
                <QRCode value={rsvp.qrToken} size={180} level="H" />
              ) : (
                <div className="flex h-[180px] w-[180px] items-center justify-center text-center style-caption text-ink-faint">
                  No meeting scheduled yet
                </div>
              )}
            </div>

            <div className="flex flex-col gap-[2px]">
              <span className="style-body-text font-semibold text-white">
                Show this code to your mentor
              </span>
              <span className="style-caption text-white/60">
                Refreshes each meeting you&apos;re checked into
              </span>
            </div>
          </div>

          {/* Timeline card */}
          <div className={`flex flex-col gap-[16px] ${CARD} border-t-[4px] border-t-[#f2a968] p-[28px]`}>
            <div className="flex flex-col gap-[2px]">
              <span className="style-caption uppercase tracking-widest text-white/60">
                Recap &amp; 10-week timeline
              </span>
              <span className="style-card-title text-white">Where we are</span>
            </div>

            {lastWeek && (
              <div className="flex items-center gap-[10px] rounded-[12px] bg-black/25 px-[16px] py-[10px]">
                <span className="w-fit shrink-0 rounded-full bg-[#f2a968] px-[12px] py-[4px] style-badge-text text-[#4a2a0a]">
                  Last week
                </span>
                <span className="style-body-text text-white/85">
                  {lastWeek.description}
                </span>
              </div>
            )}

            <div className="flex flex-col divide-y divide-white/10">
              {AIM_TIMELINE.map((milestone) => {
                const status = getMilestoneStatus(milestone, currentWeek);
                return (
                  <div
                    key={milestone.weekLabel}
                    className={`flex flex-wrap items-center justify-between gap-[12px] py-[12px] ${
                      milestone === current ? "rounded-[10px] bg-black/20 px-[10px]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-[14px]">
                      <span className="w-[48px] shrink-0 style-caption text-white/50">
                        {milestone.weekLabel}
                      </span>
                      <div className="flex flex-col">
                        <span className="style-body-text font-semibold text-white">
                          {milestone.title}
                        </span>
                        <span className="style-caption text-white/60">
                          {milestone.description} · {milestone.dueLabel}
                        </span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-[12px] py-[5px] style-badge-text ${STATUS_PILL[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
