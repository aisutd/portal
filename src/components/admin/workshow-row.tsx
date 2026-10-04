"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EventCoverImage } from "../events/event-cover-image";

export type WorkshopStatus = {
  label: string;
  bg: string;
  color: string;
};

export type WorkshopAction = {
  label: string;
  variant: "primary" | "accent" | "ghost";
  pill?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export type WorkshopRowData = {
  id: string;
  imageUrl: string | null;
  title: string;
  status: WorkshopStatus;
  /** e.g. "Oct 12 · 6:00 PM · ECSS 2.102" */
  meta: string;
  /** Attendance stats e.g. "42 Checked In" */
  leftInfo: string;
  /** Secondary stat or percentage e.g. "85% Capacity" or "12 Quiz Submissions" */
  rightInfo: string;
  progress: number;
  progressFill: string;
  /** Optional Quiz status indicator */
  quizStatus?: "PUBLISHED" | "DRAFT" | "NONE";
  /** Optional indicator if recording link is attached */
  hasRecording?: boolean;
  dim?: boolean;
  actions?: WorkshopAction[];
};

export function WorkshopRow({
  id,
  title,
  imageUrl,
  status,
  meta,
  leftInfo,
  rightInfo,
  progress,
  progressFill,
  quizStatus,
  hasRecording,
  dim,
  actions = [],
}: WorkshopRowData) {
  const isLive = status?.label?.toUpperCase() === "LIVE";
  const attendanceHref = `/admin/academy/workshops/${id}/attendance`;

  return (
    <div
      className={`group relative flex w-full flex-col gap-4 rounded-[16px] border p-5 transition-all duration-200 lg:flex-row lg:items-center lg:justify-between lg:gap-6 ${
        isLive
          ? "border-emerald-500/40 bg-emerald-50/20 ring-1 ring-emerald-500/20 shadow-sm hover:shadow-md"
          : "border-border-soft bg-white hover:border-brand/40 hover:shadow-sm"
      } ${dim ? "opacity-[0.72]" : ""}`}
    >
      {/* Clickable Overlay for Main Card Navigation */}
      <Link
        href={attendanceHref}
        className="absolute inset-0 z-0 rounded-[16px]"
        aria-label={`View attendance for ${title}`}
      />

      {/* Left Section: Cover Image + Metadata */}
      <div className="pointer-events-none z-10 flex min-w-0 items-center gap-4 lg:min-w-[280px] lg:shrink-0">
        <EventCoverImage
          className="h-[60px] w-[76px] shrink-0 rounded-[12px] object-cover shadow-xs transition-transform group-hover:scale-[1.02]"
          imageUrl={imageUrl}
        />

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="style-body-text font-semibold text-ink group-hover:text-brand transition-colors">
              {title}
            </span>

            {/* Live / Status Badge */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 style-caption text-[11px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 style-caption text-ink-faint">
            <span>{meta}</span>

            {/* Quick Badges: Recording & Quiz status */}
            {(hasRecording || quizStatus) && (
              <span className="text-border-soft">•</span>
            )}

            {hasRecording && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.2">
                🎥 Recording
              </span>
            )}

            {quizStatus === "PUBLISHED" && (
              <span className="inline-flex items-center text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200/60 rounded px-1.5 py-0.2">
                Quiz Active
              </span>
            )}
            {quizStatus === "DRAFT" && (
              <span className="inline-flex items-center text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.2">
                Quiz Draft
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Progress Bar / Attendance Metrics */}
      <div className="pointer-events-none z-10 flex min-w-0 flex-1 flex-col gap-2 lg:min-w-[200px]">
        <div className="flex flex-wrap items-center justify-between gap-x-3 style-caption text-ink-faint font-medium">
          <span>{leftInfo}</span>
          <span>{rightInfo}</span>
        </div>
        <ProgressBar
          value={progress}
          trackColor="#eceae2"
          fillColor={progressFill}
          height={8}
        />
      </div>

      {/* Right Section: Action Buttons + Nav Indicator */}
      <div className="z-20 flex flex-wrap items-center gap-2 lg:shrink-0 lg:flex-nowrap lg:justify-end">
        {actions.map((a) => {
          const buttonNode = (
            <Button
              variant={a.variant}
              size="sm"
              pill={a.pill}
              className="w-full rounded-[8px] shadow-2xs lg:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                a.onClick?.(e);
              }}
            >
              {a.label}
            </Button>
          );

          return a.href ? (
            <Link
              key={a.label}
              href={a.href}
              onClick={(e) => e.stopPropagation()}
              className="min-w-[72px] flex-1 lg:flex-none"
            >
              {buttonNode}
            </Link>
          ) : (
            <div key={a.label} className="min-w-[72px] flex-1 lg:flex-none">
              {buttonNode}
            </div>
          );
        })}

        {/* Visual Cue that Row is Clickable */}
        <div className="pointer-events-none hidden h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand lg:flex">
          →
        </div>
      </div>
    </div>
  );
}