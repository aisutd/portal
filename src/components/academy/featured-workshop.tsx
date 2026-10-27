import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { VideoNotesPanel } from "@/components/academy/video-notes-panel";
import {
  hasWorkshopStarted,
  isWorkshopInProgress,
  type AcademyWorkshopDetail,
} from "@/lib/academy-content";
import { formatEventDate } from "@/lib/utils";

/**
 * The hub's headline slot. A finished workshop headlines with its replay; one
 * that hasn't been recorded yet — because it's live or still upcoming —
 * headlines with its details instead, so the section is never empty just
 * because there's no video to play.
 */
export function FeaturedWorkshop({ workshop }: { workshop: AcademyWorkshopDetail }) {
  if (workshop.recordingUrl) {
    return (
      <VideoNotesPanel
        key={workshop.id}
        title={workshop.title}
        videoUrl={workshop.recordingUrl}
        notesKey={workshop.id}
        workshopId={workshop.id}
        userId={workshop.viewerId ?? undefined}
        quizUrl={`/academy/workshops/${workshop.id}/quiz`}
      />
    );
  }

  const isLive = isWorkshopInProgress(workshop);
  const started = hasWorkshopStarted(workshop);

  return (
    <div className="flex flex-col gap-[20px] rounded-[20px] border-[5px] border-[#d4af37] bg-[#181c25] p-[28px] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-[10px]">
        <span
          className={`w-fit rounded-full px-[12px] py-[6px] style-badge-text ${
            isLive ? "bg-[#dc2626] text-white" : "bg-[#2563eb] text-white"
          }`}
        >
          {isLive ? "Happening Now" : "Up Next"}
        </span>

        <h3 className="style-card-title uppercase text-white">{workshop.title}</h3>
        <p className="style-body-text max-w-xl text-white/70">{workshop.description}</p>

        <div className="mt-[4px] flex flex-col gap-y-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-[20px] style-caption text-white/60">
          <span className="flex items-start gap-1.5 min-w-0 w-full sm:w-auto">
            <Calendar className="h-3.5 w-3.5" />
            {formatEventDate(workshop.startTime, true)}
          </span>
          <span className="flex items-start gap-1.5 min-w-0 w-full sm:w-auto">
            <MapPin className="h-3.5 w-3.5" />
            {workshop.location}
          </span>
        </div>

        <p className="style-caption mt-[4px] text-white/50">
          {isLive
            ? "PULL UP NOW! :) Or if you can't, the recording and quiz will be here shortly."
            : "PU!! We look forward to seeing you there!"}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-[12px]">
        <Link
          href={`/academy/workshops/${workshop.id}`}
          className="rounded-full bg-[#d4af37] px-[22px] py-[12px] style-button-text text-ink transition-colors hover:bg-[#c19d2e]"
        >
          View Workshop
        </Link>
        {/* {!started && (
          <Link
            href="/events"
            className="rounded-full border border-white/25 px-[22px] py-[12px] style-button-text text-white transition-colors hover:border-white/50"
          >
            RSVP
          </Link>
        )} */}
      </div>
    </div>
  );
}
