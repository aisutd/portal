"use client";

import { cn } from "@/lib/utils";

type SegmentedTabsProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/**
 * Pill segmented control (e.g. "Sign up" / "Log in").
 * Active segment lifts onto a white chip; inactive segments are muted.
 */
export function SegmentedTabs({
  options,
  value,
  onChange,
  className,
}: SegmentedTabsProps) {
  return (
    <div
      className={cn(
        "flex items-stretch gap-[4px] rounded-[10px] bg-tab-track p-[4px]",
        className
      )}
      role="tablist"
    >
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option)}
            className={cn(
              "flex-1 rounded-[7px] p-[9px] text-center font-grotesk text-[13px] font-semibold leading-[normal] transition-colors",
              active
                ? "bg-white text-ink-card shadow-tab"
                : "text-tab-muted hover:text-ink-card"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
