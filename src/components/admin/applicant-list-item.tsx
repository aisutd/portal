import { cn } from "@/lib/utils";

export type Applicant = {
  name: string;
  /** e.g. "aja210 · new" */
  meta: string;
  /** Optional review score shown as a pill. */
  score?: string;
  active?: boolean;
};

/**
 * A row in the left applicant queue. The active applicant gets a brand border;
 * scored applicants show a purple score pill.
 */
export function ApplicantListItem({ name, meta, score, active }: Applicant) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-[10px] rounded-[16px] border bg-white p-[14px]",
        active ? "border-brand" : "border-border-soft"
      )}
    >
      <span className="size-[36px] shrink-0 rounded-full border border-border-soft bg-photo" />
      <div className="min-w-0 flex-1">
        <p className="font-body  font-bold leading-[22.5px] text-ink">
          {name}
        </p>
        <p className="font-mono  leading-[16.8px] tracking-[0.2px] text-ink-faint">
          {meta}
        </p>
      </div>
      {score && (
        <span className="inline-flex shrink-0 items-center rounded-full bg-purple-soft px-[14px] py-[5px] font-body  font-semibold leading-[normal] text-purple-ink">
          {score}
        </span>
      )}
    </div>
  );
}
