export type Step = {
  /** e.g. "STEP 1" */
  step: string;
  title: string;
  /** Two short lines of supporting copy. */
  description: string;
  /** Large watermark numeral. */
  number: string;
};

/**
 * Numbered "How to Begin" card: brand-outlined panel with an oversized,
 * very-light watermark numeral bleeding off the right edge.
 */
export function StepCard({ step, title, description, number }: Step) {
  return (
    <div className="relative flex flex-1 flex-col gap-[6px] self-stretch overflow-hidden rounded-[18px] border border-brand bg-white px-[23px] pb-[25px] pt-[24px]">
      <p className="style-meta-text  leading-[16.8px] tracking-[0.2px] text-brand">
        {step}
      </p>
      <h3 className="style-card-title  leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]">
        {title}
      </h3>
      <p className="max-w-[230px] style-body-text  leading-[20.3px] text-ink-muted">
        {description}
      </p>

      <span
        aria-hidden
        className="pointer-events-none absolute right-[14px] top-[80px] select-none style-page-title leading-[74px] text-brand-soft [font-variation-settings:'wdth'_100]"
      >
        {number}
      </span>
    </div>
  );
}
