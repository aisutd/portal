"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { VideoNotesPanel } from "@/components/academy/video-notes-panel";
import type { AcademyWorkshopDetail } from "@/lib/academy-content";
import { useState } from "react";

export function WorkshopDetailClient({ workshop, initiallyCompleted }: { workshop: AcademyWorkshopDetail, initiallyCompleted?: boolean}) {
  const hasQuiz = workshop.questions.length > 0;
  const attempt = workshop.latestAttempt;

  return (
    <div className="flex flex-col gap-[24px]">
      {workshop.hasAttended && (
        <div className="flex items-center gap-2 rounded-[14px] border border-emerald-200 bg-[#d2ecd9] px-[16px] py-[12px] style-body-text text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          You already have attendance for this workshop! Enjoy the replay.
        </div>
      )}

      <VideoNotesPanel
        key={workshop.id}
        title={workshop.title}
        videoUrl={workshop.recordingUrl}
        notesKey={workshop.id}
        workshopId={workshop.id}
        userId={workshop.viewerId ?? undefined}
        initiallyCompleted={initiallyCompleted}
        quizUrl={`/academy/workshops/${workshop.id}/quiz`}
      />

      {workshop.summary && (
        <p className="style-body-text text-white/75">{workshop.summary}</p>
      )}

      {hasQuiz && (attempt !== null || !workshop.hasAttended) && (
        <div className="flex flex-wrap items-center justify-between gap-[16px] rounded-[20px] border border-[#2a2f3a] bg-[#181c25] p-5 md:p-[24px]">
          <div className="flex flex-col gap-[4px]">
            <span className="style-card-title text-white">
              {attempt ? "Your quiz attempt" : "Missed this workshop?"}
            </span>
            <span className="style-caption text-white/60">
              {attempt
                ? `You scored ${attempt.correctCount}/${attempt.total}. Review the answers you gave.`
                : `Watch the recording above, then answer ${workshop.questions.length} question${
                    workshop.questions.length === 1 ? "" : "s"
                  } to earn attendance credit.`}
            </span>
          </div>
          <Link
            href={`/academy/workshops/${workshop.id}/quiz`}
            className="w-full rounded-full bg-[#d4af37] px-[24px] py-[12px] text-center style-button-text text-ink transition-colors hover:bg-[#c19d2e] sm:w-auto"
          >
            {attempt ? "Review Answers" : "Take Quiz"}
          </Link>
        </div>
      )}
    </div>
  );
}
