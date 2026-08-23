import { cn } from "@/lib/utils";

export type StatCardData = {
  value: string;
  label: string;
  /** Highlights the card (brand border + brand number). */
  highlight?: boolean;
};

/**
 * Big-number summary card used across admin overview rows.
 */
export function StatCard({ value, label, highlight }: StatCardData) {
  return (
    <div
      className={cn(
        "group relative flex flex-1 flex-col gap-[5px] self-stretch overflow-hidden rounded-[14px] border px-[23px] py-[21px]",
        "transition-[border-color,box-shadow,transform] duration-150",
        "hover:-translate-y-[2px] hover:shadow-[0_10px_24px_-14px_rgba(22,22,28,0.35)]",
        highlight
          ? "border-brand bg-gradient-to-b from-brand-soft/60 to-white"
          : "border-border-soft bg-white hover:border-ink-faint/40"
      )}
    >
      {/* Accent rail: colour without competing with the number. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-[3px]",
          highlight ? "bg-brand" : "bg-border-soft group-hover:bg-brand/40"
        )}
      />

      <span
        className={cn(
          "style-section-header leading-[34px] [font-variation-settings:'wdth'_100]",
          highlight ? "text-brand" : "text-ink"
        )}
      >
        {value}
      </span>
      <span className="font-techno  uppercase leading-[16px] tracking-[1.1px] text-ink-faint">
        {label}
      </span>
    </div>
  );
}
