"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type ProgressBarProps = {
  /** Fill percentage, 0–100. */
  value: number;
  trackColor: string;
  fillColor: string;
  /** Track height in px (7 in the status strip, 8 in the applications card). */
  height?: number;
  className?: string;
};

/**
 * Rounded progress meter. Track and fill colours are explicit because the design
 * uses blue, orange and a lighter blue across different contexts.
 */
export function ProgressBar({
  value,
  trackColor,
  fillColor,
  height = 7,
  className,
}: ProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setDisplayValue(value));
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-md", className)}
      style={{ height, backgroundColor: trackColor }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, displayValue))}%`, backgroundColor: fillColor }}
      />
    </div>
  );
}
