"use client";

import { useCallback, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { VideoNotesPanel } from "@/components/academy/video-notes-panel";
import type { AcademyWorkshopDetail } from "@/lib/academy-content";
import { WorkshopQuizPanel } from "@/components/academy/workshop-quiz-panel";

export function WorkshopDetailClient({ workshop, initiallyCompleted }: { workshop: AcademyWorkshopDetail, initiallyCompleted?: boolean}) {
  const [watched, setWatched] = useState(false);
  const completed = (initiallyCompleted ?? workshop.progressCompleted) || watched;
  const handleCompleted = useCallback(() => setWatched(true), []);

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
        initiallyCompleted={initiallyCompleted ?? workshop.progressCompleted}
        onCompleted={handleCompleted}
        quizUrl={`/academy/workshops/${workshop.id}/quiz`}
      />

      {workshop.summary && (
        <p className="style-body-text text-white/75">{workshop.summary}</p>
      )}
      {completed && <WorkshopQuizPanel workshop={workshop} />}
    </div>
  );
}
