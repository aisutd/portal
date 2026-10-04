"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { ReactNode, MouseEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  Calendar,
  ChevronRight,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgramType } from "@prisma/client";
import { getProgramTypeDesign, type ProgramTypeDesign } from "@/lib/program-types";

type RowAction = {
  label: string;
  variant: "primary" | "accent" | "soft" | "ghost" | "outline";
  pill?: boolean;
  href?: string;
  disabled?: boolean;
};

export type OpenApp = {
  id?: string | number; // Added optional id prop for dynamic routing
  title: string;
  description: string;
  meta: string;
  borderColor?: string;
  closeAt?: string | Date;
  metaMedium?: boolean;
  dim?: boolean;
  statusBadge?: ReactNode;
  programType?: ProgramType | string | Partial<ProgramTypeDesign>;
  actions: RowAction[];
};

/** Standardized AIS Badge Component */
function RowBadge({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`inline-flex h-5 items-center gap-1.5 rounded-md border px-2.5 style-badge-text tracking-tight transition-all shrink-0 ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

export function OpenAppRow({
  id,
  title,
  description,
  meta,
  closeAt,
  dim = false,
  statusBadge,
  programType,
  actions,
}: OpenApp) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleRowClick = () => {
    router.push(`/applications/detail?id=${id}`);
  };

  const handleActionClick = (
    e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    action: RowAction,
  ) => {
    e.stopPropagation();

    if ((action.label === "Apply" || action.label === "Remind me") && !isSignedIn) {
      e.preventDefault();
      router.push("/onboarding?mode=login");
    }
  };

  // --- REVISED STATUS & DATE LOGIC ---
  const now = new Date().getTime();
  const closeTime = closeAt ? new Date(closeAt).getTime() : null;
  const daysUntilClose = closeTime ? (closeTime - now) / (1000 * 60 * 60 * 24) : null;

  // Check if the application has passed its closing date
  const isPastCloseDate = closeTime !== null && closeTime < now;

  // Ensure 'meta' explicitly indicates live state and isn't marked as 'closed' or 'draft/unpublished'
  const metaLower = meta.toLowerCase();
  const isExplicitlyClosed = metaLower.includes("closed") || isPastCloseDate;
  const isUnpublished = metaLower.includes("draft") || metaLower.includes("unpublished") || dim;

  // Live status condition
  const isLiveOpen = !isExplicitlyClosed && !isUnpublished && (metaLower.includes("open") || metaLower.includes("closes"));
  const isUpcoming = !isExplicitlyClosed && !isUnpublished && (metaLower.includes("opens") || metaLower.includes("starts"));

  const isClosingSoon =
    isLiveOpen && daysUntilClose !== null && daysUntilClose >= 0 && daysUntilClose <= 5;

  const badgeDesign = getProgramTypeDesign(programType);

  return (
    <motion.div
      initial={false}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleRowClick}
      className={`group relative flex w-full flex-col sm:flex-row items-stretch justify-between overflow-visible rounded-2xl bg-white/75 backdrop-blur-md border-white/35 border-2 shadow-sm shadow-ink/15 transition-all duration-300 hover:border-brand/40 hover:shadow-md cursor-pointer ${
        dim ? "opacity-60 grayscale-[20%]" : "opacity-100"
      }`}
    >
      {/* Side Color Block */}
      {badgeDesign && (
        <div
          className="relative w-full h-12 sm:h-auto sm:w-20 shrink-0 flex items-center justify-end sm:justify-center rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl border-b sm:border-b-0 sm:border-r transition-colors duration-300 z-10 pr-3 sm:pr-0"
          style={{
            backgroundColor: badgeDesign.badgeBg || "var(--color-row-soft)",
            borderColor: badgeDesign.badgeBorder || "var(--color-border-soft,#e7e2d4)",
          }}
        >
          {badgeDesign.iconUrl ? (
            <div className="relative sm:absolute sm:inset-0 flex items-center justify-end sm:justify-center overflow-visible pointer-events-none z-30">
              <Image
                src={badgeDesign.iconUrl}
                alt={badgeDesign.label || "Program cover"}
                width={76}
                height={76}
                className="h-10 w-10 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110 sm:h-auto sm:w-full sm:max-w-[140%] sm:max-h-[140%]"
              />
            </div>
          ) : badgeDesign.icon ? (
            <badgeDesign.icon
              className="h-6 w-6 sm:h-8 sm:w-8 z-30 transition-transform duration-300 group-hover:scale-110"
              style={{ color: badgeDesign.badgeColor || "var(--color-ink,#16161c)" }}
            />
          ) : (
            <span
              className="text-base sm:text-xl font-black tracking-tight uppercase z-30"
              style={{ color: badgeDesign.badgeColor || "var(--color-ink)" }}
            >
              {(badgeDesign.label || title).slice(0, 2)}
            </span>
          )}
        </div>
      )}

      {/* Main Content Body */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-1 p-4 min-w-0 z-20">
        <div className="min-w-0 flex-1 space-y-1">
          {/* Status Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {isLiveOpen && isClosingSoon && (
              <RowBadge className="border-amber-500/30 bg-[var(--color-orange-soft,#fbe3cb)] text-[var(--color-orange-ink,#7a4416)] animate-pulse">
                <Flame className="h-3 w-3 text-amber-600 shrink-0" />
                <span>Closing Soon</span>
                {daysUntilClose !== null && daysUntilClose >= 1 && (
                  <span className="opacity-80 font-normal">
                    ({Math.ceil(daysUntilClose)}d left)
                  </span>
                )}
              </RowBadge>
            )}

            {isLiveOpen && !isClosingSoon && (
              <RowBadge className="border-emerald-500/30 bg-emerald-50 text-emerald-900">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Open</span>
              </RowBadge>
            )}

            {isUpcoming && (
              <RowBadge className="border-indigo-200 bg-brand-soft text-brand-dark">
                <Sparkles className="h-3 w-3 text-brand shrink-0" />
                <span>Upcoming</span>
              </RowBadge>
            )}

            {badgeDesign && (
              <RowBadge
                style={{
                  backgroundColor: badgeDesign.badgeBg,
                  color: badgeDesign.badgeColor,
                  borderColor: badgeDesign.badgeBorder || badgeDesign.borderColor,
                }}
              >
                <span>{badgeDesign.label}</span>
              </RowBadge>
            )}

            {statusBadge && <div className="shrink-0 flex items-center">{statusBadge}</div>}
          </div>

          {/* Program Title */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <h3 className="style-card-title text-slate-900 transition-colors duration-200 group-hover:text-brand">
              {title}
            </h3>
            <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 transition-all duration-200 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[var(--color-brand,#2f5fe8)]" />
          </div>

          {/* Description */}
          <p className="line-clamp-2 sm:line-clamp-1 style-body-text text-ink-muted">
            {description}
          </p>

          {/* Meta Information */}
          <div className="flex items-center gap-1.5 style-meta-text text-ink-faint pt-0.5">
            <Calendar className="h-3.5 w-3.5 opacity-70 shrink-0" />
            <span className="truncate">{meta}</span>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 z-30">
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
              className={`btn-fun-animation flex-1 sm:flex-initial justify-center gap-1 style-button-text h-9.5 px-4 rounded-xl transition-all shadow-2xs hover:shadow-xs ${
                action.variant === "primary"
                  ? "bg-brand hover:bg-brand-dark text-white"
                  : ""
              }`}
            >
              <span>{action.label}</span>
              {action.variant === "primary" && (
                <ChevronRight className="h-4 w-4 opacity-90 transition-transform group-hover:translate-x-0.5" />
              )}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}