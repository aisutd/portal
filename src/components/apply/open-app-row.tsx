"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type RowAction = {
  label: string;
  variant: "primary" | "accent" | "soft" | "ghost" | "outline";
  pill?: boolean;
  href?: string;
  disabled?: boolean;
};

export type OpenApp = {
  title: string;
  description: string;
  meta: string;
  borderColor: string;
  metaMedium?: boolean;
  dim?: boolean;
  statusBadge?: ReactNode;
  actions: RowAction[];
};

/**
 * A single row in the applications list: details on the left and CTA(s) on the
 * right.
 */
export function OpenAppRow({
  title,
  description,
  meta,
  borderColor,
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
        <div className="flex flex-wrap items-start gap-[10px]">
          <h3 className="style-card-title  leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
            {title}
          </h3>
          {statusBadge ? <div className="shrink-0">{statusBadge}</div> : null}
        </div>
        <p className="mt-[6px] style-body-text  leading-[20.3px] text-ink-muted">
          {description}
        </p>
        <p className="mt-[5px] style-meta-text  leading-[16.8px] tracking-[0.2px] text-ink-faint">
          {meta}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-[10px]">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            size="md"
            pill={action.pill}
            type={action.href ? undefined : "button"}
            disabled={action.disabled}
            href={action.href}
            onClick={() => handleActionClick(action.label)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
