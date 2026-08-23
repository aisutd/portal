import { cn } from "@/lib/utils";

type ScoreScaleProps = {
  /** Currently selected score (1-5), if any. */
  selected?: number;
  max?: number;
};

/**
 * Row of square score chips (1…max). The selected chip fills brand blue.
 * Presentational only — wire up onChange when the review flow becomes live.
 */
export function ScoreScale({ selected, max = 5 }: ScoreScaleProps) {
  return (
    <div className="flex shrink-0 gap-[6px]">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const isOn = n === selected;
        return (
          <span
            key={n}
            className={cn(
              "flex size-[24px] items-center justify-center rounded-[12px] border text-center font-mono  leading-[normal]",
              isOn
                ? "border-brand bg-brand text-white"
                : "border-border-soft text-ink-faint"
            )}
          >
            {n}
          </span>
        );
      })}
    </div>
  );
}
