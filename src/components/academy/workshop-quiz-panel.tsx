import Link from "next/link";
import type { AcademyWorkshopDetail } from "@/lib/academy-content";

export function WorkshopQuizPanel({ workshop }: { workshop: AcademyWorkshopDetail }) {
  const attempt = workshop.latestAttempt;

  if (workshop.questions.length === 0 || (attempt === null && workshop.hasAttended)) {
    return null;
  }

  return (
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
  );
}
