export type Reviewer = {
  name: string;
  score: string;
  /** Score pill palette. */
  tone: "brand" | "purple";
  comment: string;
};

/**
 * A reviewer's score + short note, shown alongside the rubric.
 */
export function ReviewerCard({ name, score, tone, comment }: Reviewer) {
  const pill =
    tone === "brand"
      ? "bg-brand-soft text-brand-dark"
      : "bg-purple-soft text-purple-ink";

  return (
    <div className="flex w-full flex-col gap-[7px] rounded-[16px] border border-border-soft bg-white p-[19px]">
      <div className="flex items-center justify-between">
        <p className="style-body-text leading-[22.5px] text-ink">
          {name}
        </p>
        <span
          className={`inline-flex items-center rounded-full px-[14px] py-[5px] style-body-text leading-[normal] ${pill}`}
        >
          {score}
        </span>
      </div>
      <p className="style-caption leading-[16.8px] tracking-[0.2px] text-ink-faint">
        {comment}
      </p>
    </div>
  );
}
