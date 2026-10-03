import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { AcademyGradientBackground } from "@/components/academy/gradient-background";
import { WorkshopDetailClient } from "@/components/academy/workshop-detail-client";
import type { AcademyWorkshopDetail } from "@/lib/academy-content";
import { formatEventDate } from "@/lib/utils";

type MobileWorkshopDetailProps = {
  workshop: AcademyWorkshopDetail;
  stage: { label: string; className: string };
  showContent: boolean;
  isSignedIn: boolean;
};

/**
 * Mobile workshop detail. The body reuses the same content component as
 * desktop — only the page chrome differs, so the recording, notes and quiz
 * entry point stay in one place.
 */
export function MobileWorkshopDetail({
  workshop,
  stage,
  showContent,
  isSignedIn,
}: MobileWorkshopDetailProps) {
  return (
    <MobileScreen>
      <AcademyGradientBackground />

      <Link
        href="/academy"
        className="style-caption w-fit leading-[16.8px] tracking-[0.2px] text-[#d4af37]"
      >
        ← Back to AI Academy
      </Link>

      <section className="relative overflow-hidden rounded-2xl border-t-[6px] border-b-[6px] border-[#2f5fe8] bg-[#181c25] p-5">
        <span
          className={`mb-2 inline-block w-fit rounded-full px-3 py-1.5 style-badge-text ${stage.className}`}
        >
          {stage.label}
        </span>
        <h1 className="style-mobile-title text-xl leading-tight text-white">
          {workshop.title}
        </h1>
        <p className="style-mobile-body mt-2 whitespace-pre-wrap text-white/75">
          {workshop.description}
        </p>
        <div className="mt-4 flex flex-col gap-2 style-caption text-white/60">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {formatEventDate(workshop.startTime, true)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {workshop.location}
          </span>
          {workshop.questions.length > 0 && workshop.quizDueAt && (
            <span className="flex items-center gap-1.5 text-[#f2c95c]">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              Quiz due: {formatEventDate(workshop.quizDueAt, true)}
            </span>
          )}
        </div>
      </section>

      {!showContent ? (
        <div className="rounded-2xl border border-dashed border-[#2a2f3a] bg-[#181c25] p-5 text-center style-mobile-body text-white/70">
          This workshop hasn&apos;t started yet. The recording and quiz will appear here post
          workshop.
        </div>
      ) : !isSignedIn ? (
        <div className="rounded-2xl border border-dashed border-[#2a2f3a] bg-[#181c25] p-5 text-center style-mobile-body text-white/70">
          <Link href="/sign-in" className="text-[#7aa2ff] underline">
            Sign in
          </Link>{" "}
          to watch the recording and take the attendance quiz.
        </div>
      ) : (
        <WorkshopDetailClient workshop={workshop} />
      )}

      <BottomNav />
    </MobileScreen>
  );
}
