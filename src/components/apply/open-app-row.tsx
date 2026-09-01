"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { ReactNode, MouseEvent } from "react";
import { motion } from "framer-motion";
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
  closeAt?: string | Date;
  metaMedium?: boolean;
  dim?: boolean;
  statusBadge?: ReactNode;
  actions: RowAction[];
};

/**
 * A single row in the applications list: details on the left and CTA(s) on the right.
 */
export function OpenAppRow({
  title,
  description,
  meta,
  borderColor,
  closeAt,
  metaMedium = false,
  dim = false,
  statusBadge,
  actions,
}: OpenApp) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleActionClick = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>, action: RowAction) => {
    // Intercept action if login is required
    if ((action.label === "Apply" || action.label === "Remind me") && !isSignedIn) {
      e.preventDefault(); // Stop default href navigation to prevent request cancellation
      e.stopPropagation();
      router.push("/onboarding?mode=login");
    }
  };

  const isLiveOpen = meta.startsWith("closes");
  const isUpcoming = meta.startsWith("opens");

  const now = new Date().getTime();
  const closeTime = closeAt ? new Date(closeAt).getTime() : null;
  const daysUntilClose = closeTime ? (closeTime - now) / (1000 * 60 * 60 * 24) : null;
  
  // Closing Soon if open phase and closes within 5 days
  const isClosingSoon = isLiveOpen && (daysUntilClose === null || (daysUntilClose >= 0 && daysUntilClose <= 5));

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group relative flex w-full flex-col items-start gap-[16px] overflow-hidden rounded-[18px] border bg-white/95 backdrop-blur-xs p-[24px] sm:flex-row sm:items-center sm:justify-between sm:gap-[24px] shadow-2xs transition-all duration-300 hover:shadow-md ${
        isLiveOpen
          ? isClosingSoon
            ? "border-l-4 border-l-amber-500"
            : "border-l-4 border-l-brand"
          : isUpcoming
          ? "border-l-4 border-l-amber-500"
          : "border-l-4 border-l-slate-300"
      }`}
      style={{ borderColor, opacity: dim ? 0.94 : 1 }}
    >
      {/* Background subtle tint glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-[10px]">
          {isLiveOpen && isClosingSoon && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 shadow-2xs">
              <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              Closing Soon
            </span>
          )}
          {isLiveOpen && !isClosingSoon && (
            <span className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          {isUpcoming && (
            <span className="relative flex h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          )}

          <h3 className="style-card-title text-lg font-bold leading-[21.25px] text-ink [font-variation-settings:'wdth'_100] group-hover:text-brand transition-colors duration-200">
            {title}
          </h3>
          {statusBadge ? <div className="shrink-0">{statusBadge}</div> : null}
        </div>

        <p className="mt-[6px] style-body-text text-sm leading-[20.3px] text-ink/80 font-normal line-clamp-3">
          {description}
        </p>
        <p className="mt-[6px] style-meta-text text-xs leading-[16.8px] tracking-[0.2px] text-ink-faint font-mono-alt">
          {meta}
        </p>
      </div>

      <div className="relative z-10 flex shrink-0 flex-wrap gap-[10px]">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            size="md"
            pill={action.pill}
            type={action.href ? undefined : "button"}
            disabled={action.disabled}
            href={action.href}
            onClick={(e) => handleActionClick(e, action)}
            className="shadow-2xs transition-all duration-200 hover:shadow-xs active:scale-[0.98]"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}