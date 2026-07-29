"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

type RowAction = {
  label: string;
  variant: "primary" | "accent" | "soft" | "ghost";
  pill?: boolean;
  href?: string;
};

export type OpenApp = {
  title: string;
  description: string;
  /** e.g. "closes June 25, 2026 · 11:59 PM CT" */
  meta: string;
  borderColor: string;
  /** Medium-weight meta for active rows; regular for the upcoming one. */
  metaMedium?: boolean;
  /** Slightly fades the not-yet-open row. */
  dim?: boolean;
  statusBadge?: ReactNode;
  actions: RowAction[];
};

/**
 * A single row in "Open Applications Right Now": details on the left,
 * a pair of CTAs on the right.
 */
export function OpenAppRow({
  title,
  description,
  meta,
  borderColor,
  metaMedium = false,
  dim = false,
  statusBadge,
  actions,
}: OpenApp) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleActionClick = (label: string) => {
    if ((label === "Apply" || label === "Remind me") && !isSignedIn) {
      router.push("/onboarding?mode=login");
    }
  };

  return (
    <div
      className="flex w-full flex-col items-start gap-[16px] rounded-[16px] border bg-white p-[25px] sm:flex-row sm:items-center sm:justify-between sm:gap-[24px]"
      style={{ borderColor, opacity: dim ? 0.94 : 1 }}
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-[17px] font-semibold leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
          {title}
        </h3>
        <p className="mt-[6px] font-body text-[14px] font-normal leading-[20.3px] text-ink-muted">
          {description}
        </p>
        <p
          className={`mt-[5px] font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-ink-faint ${
            metaMedium ? "font-medium" : "font-normal"
          }`}
        >
          {meta}
        </p>
      </div>

      <div className="flex shrink-0 gap-[10px]">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            size="md"
            pill={action.pill}
            type="button"
            onClick={() => handleActionClick(action.label)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
