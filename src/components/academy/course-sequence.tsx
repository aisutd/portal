import Link from "next/link";
import { EventCoverImage } from "../events/event-cover-image";
import { Calendar, Play } from "lucide-react";
import {
  isWorkshopInProgress,
  isWorkshopPast,
  type AcademyWorkshopSummary,
} from "@/lib/academy-content";
import { formatEventDate } from "@/lib/utils";

type LessonStatus =
  | "completed"
  | "make-up-available"
  | "missed"
  | "happening-now"
  | "up-next"
  | "coming-up";

const STATUS: Record<LessonStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-emerald-600 text-white" },
  "make-up-available": { label: "Watch to Make Up", className: "bg-[#d4af37] text-ink" },
  missed: { label: "Missed", className: "bg-[#6b7280] text-white" },
  "happening-now": { label: "Happening Now", className: "bg-[#dc2626] text-white" },
  "up-next": { label: "Up Next", className: "bg-[#2563eb] text-white" },
  "coming-up": { label: "Coming Up", className: "bg-[#434655] text-white" },
};

/**
 * Status reflects the viewer's own standing, not just the calendar — a
 * workshop is "Completed" because they have attendance credit for it, never
 * merely because its date has passed.
 */
function getStatus(workshop: AcademyWorkshopSummary, upNextId: string | undefined): LessonStatus {
  if (workshop.hasAttended) return "completed";
  if (isWorkshopInProgress(workshop)) return "happening-now";

  if (isWorkshopPast(workshop)) {
    return workshop.hasRecording ? "make-up-available" : "missed";
  }

  return workshop.id === upNextId ? "up-next" : "coming-up";
}

export function CourseSequence({
  workshops,
}: {
  workshops: (AcademyWorkshopSummary & { imageUrl?: string | null })[];
}) {
  const sequence = [...workshops].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const upNextId = sequence.find(
    (w) => !isWorkshopPast(w) && !isWorkshopInProgress(w)
  )?.id;

  if (sequence.length === 0) {
    return (
      <p className="rounded-[20px] border border-dashed border-[#2a2f3a] bg-[#181c25] p-[24px] text-center style-body-text text-white/60">
        No workshops have been published yet — check back soon.
      </p>
    );
  }

  return (
    <div className="flex snap-x snap-mandatory gap-[20px] overflow-x-auto pb-[8px] scrollbar-none">
      {sequence.map((workshop, idx) => {
        const { label, className } = STATUS[getStatus(workshop, upNextId)];

        return (
          <Link
            key={workshop.id}
            href={`/academy/workshops/${workshop.id}`}
            className="w-[280px] shrink-0 snap-start"
          >
            <div className="group flex h-full max-h-80 flex-col gap-[12px] rounded-[20px] border border-[#2a2f3a] bg-[#181c25] p-[14px] transition-all duration-200 hover:-translate-y-[2px] hover:border-[#2563eb]/60">
              
              {/* Media Container */}
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[14px] border-[3px] border-[#d4af37] bg-[linear-gradient(135deg,#2f5fe8_0%,#434655_100%)]">
                {/* Workshop Image */}
                {(workshop.imageUrl ? 
                  <EventCoverImage
                    imageUrl={workshop.imageUrl}
                    alt={workshop.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    fallbackText="WORKSHOP"
                  /> :
                  <EventCoverImage
                    imageUrl={`/images/ais_logo_black-bg.jpg`}
                    alt={workshop.title}
                    className="h-full w-full object-cover bg-black transition-transform duration-300 group-hover:scale-105"
                    fallbackText="WORKSHOP"
                  />
                )}
                {/* Bottom-left Play Button Badge (Only shown when recording is available) */}
                {workshop.hasRecording && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 backdrop-blur-md transition-transform group-hover:scale-105">
                    <span className="flex size-6 items-center justify-center rounded-full bg-[#2563eb]">
                      <Play className="ml-0.5 h-3 w-3 fill-white text-white" />
                    </span>
                    <span className="text-[11px] font-semibold text-white tracking-wide">
                      Watch
                    </span>
                  </div>
                )}
              </div>

              {/* Text Info */}
              <div className="flex flex-col gap-[6px]">
                <h3 className="style-card-title text-white line-clamp-1">
                  {idx + 1} - {workshop.title}
                </h3>
                <p className="style-caption text-white/70 line-clamp-2">
                  {workshop.description}
                </p>
              </div>

              {workshop.quizDueAt && (
                <span className="flex items-center gap-1.5 style-caption text-[#f2c95c]">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  Quiz due: {formatEventDate(workshop.quizDueAt, true)}
                </span>
              )}

              {/* Status Badge */}
              <span className={`w-fit rounded-full px-[12px] py-[6px] style-badge-text ${className}`}>
                {label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}