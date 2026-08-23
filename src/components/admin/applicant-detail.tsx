import { Button } from "@/components/ui/button";
import { ScoreScale } from "@/components/admin/score-scale";
import { ReviewerCard, type Reviewer } from "@/components/admin/reviewer-card";

export type RubricCriterion = { label: string; selected: number };
export type Question = { prompt: string; lines: string[] };

export type ApplicantDetailData = {
  name: string;
  netid: string;
  email: string;
  phone: string;
  roleBadge: string;
  statusBadge: string;
  appliedAt: string;
  questions: Question[];
  rubric: RubricCriterion[];
  overall: string;
  reviewers: Reviewer[];
  combinedAvg: string;
};

/**
 * The right-hand review surface: applicant identity, external links, the
 * submitted answers (shown as redacted skeleton lines), the scoring rubric +
 * reviewer notes, and the decision action bar.
 */
export function ApplicantDetail({
  name,
  netid,
  email,
  phone,
  roleBadge,
  statusBadge,
  appliedAt,
  questions,
  rubric,
  overall,
  reviewers,
  combinedAvg,
}: ApplicantDetailData) {
  return (
    <div className="flex h-full min-w-px flex-1 flex-col gap-[14px] rounded-[16px] border border-border-soft bg-white p-[26px]">
      {/* Identity */}
      <div className="flex items-center gap-[16px]">
        <span className="size-[56px] shrink-0 rounded-full border border-border-soft bg-photo" />
        <div className="min-w-0 flex-1">
          <h2 className="style-section-header leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]">
            {name}
          </h2>
          <p className="style-caption leading-[16.8px] tracking-[0.2px] text-ink-faint">
            {netid} ·{" "}
            <a href={`mailto:${email}`} className=" underline">
              {email}
            </a>{" "}
            · {phone}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-orange-soft px-[14px] py-[5px] style-body-text leading-[normal] text-orange-ink">
          {roleBadge}
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full bg-brand-soft px-[14px] py-[5px] style-body-text leading-[normal] text-brand-dark">
          {statusBadge}
        </span>
      </div>

      {/* Links + applied date */}
      <div className="flex items-center justify-between">
        <div className="flex gap-[10px]">
          <Button variant="soft" size="sm">
            Resume ↗
          </Button>
          <Button variant="soft" size="sm">
            LinkedIn ↗
          </Button>
          <Button variant="ghost" size="sm">
            GitHub ↗
          </Button>
        </div>
        <p className="style-caption leading-[16.8px] tracking-[0.2px] text-ink-faint">
          {appliedAt}
        </p>
      </div>

      <div className="h-px w-full bg-border-soft" />

      {/* Answers (redacted skeleton) */}
      <div className="flex flex-col gap-[8px]">
        {questions.map((q) => (
          <div key={q.prompt} className="flex flex-col gap-[8px]">
            <h3 className="style-section-header leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
              {q.prompt}
            </h3>
            {q.lines.map((w, i) => (
              <span
                key={i}
                className="h-[10px] rounded-[6px] bg-skeleton"
                style={{ width: w }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Scoring */}
      <div className="flex items-start gap-[16px]">
        {/* Rubric */}
        <div className="flex flex-1 flex-col gap-[12px] self-stretch rounded-[14px] bg-row-soft p-[22px]">
          <div className="flex items-center justify-between">
            <h3 className="style-section-header leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
              Scoring rubric
            </h3>
            <span className="style-caption leading-[16.8px] tracking-[0.2px] text-ink-faint">
              your scores
            </span>
          </div>

          {rubric.map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <span className="style-body-text leading-[20.3px] text-ink-muted">
                {c.label}
              </span>
              <ScoreScale selected={c.selected} />
            </div>
          ))}

          <div className="h-px w-full bg-border-soft" />

          <div className="flex items-center justify-between">
            <span className="style-body-text leading-[22.5px] text-ink">
              Your overall
            </span>
            <span className="style-body-text leading-[22.5px] text-ink">
              {overall}
            </span>
          </div>
        </div>

        {/* Reviewers */}
        <div className="flex w-[320px] shrink-0 flex-col gap-[12px] self-stretch">
          {reviewers.map((r) => (
            <ReviewerCard key={r.name} {...r} />
          ))}
          <div className="flex items-center justify-between rounded-[16px] border border-brand bg-brand-soft px-[21px] py-[17px]">
            <span className="style-body-text leading-[22.5px] text-brand-dark">
              Combined avg
            </span>
            <span className="style-section-header leading-[25.96px] text-brand-dark [font-variation-settings:'wdth'_100]">
              {combinedAvg}
            </span>
          </div>
        </div>
      </div>

      {/* Decision bar */}
      <div className="flex items-center gap-[12px]">
        <Button variant="danger" size="md">
          ✕ Reject
        </Button>
        <Button variant="accent" size="md" pill={false}>
          ★ Shortlist
        </Button>
        <Button variant="primary" size="md" className="flex-1">
          ✓ Accept
        </Button>
        <Button variant="outline" size="md">
          Next →
        </Button>
      </div>
    </div>
  );
}
