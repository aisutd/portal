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
      className={`group relative flex w-full flex-col gap-4 rounded-2xl ring-[0.5px] p-5 transition-all lg:flex-row lg:items-center lg:gap-5 ${
        isLive
          ? "bg-checked/60 ring-checked-text/15 shadow-md shadow-ink/10"
          : "ring-ink-faint/15 bg-white/60 hover:ring-brand/40 hover:shadow-sm"
      } ${dim ? "opacity-[0.72]" : ""}`}
    >
      {/* Clickable Overlay for Main Card Navigation */}
      <Link
        href={attendanceHref}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`View attendance for ${title}`}
      />

      {/* Left Section: Thumbnail + Title & Metadata */}
      <div className="pointer-events-none z-10 flex flex-1 items-center gap-4 lg:min-w-[250px] lg:flex-none lg:gap-5">
        {/* Thumbnail */}
        {imageUrl ? (
          <EventCoverImage
            imageUrl={imageUrl}
            alt={title}
            className="h-[56px] w-[72px] shrink-0 rounded-[12px] transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <EventCoverImage
            imageUrl="/images/ais_logo_black-bg.jpg"
            alt={title}
            className="h-[56px] w-[72px] shrink-0 rounded-[12px] transition-transform group-hover:scale-[1.02]"
          />
        )}

        {/* Title + schedule + extra workshop badges */}
        <div className="flex flex-col gap-[5px]">
          <div className="flex flex-wrap items-center gap-[10px]">
            <span className="style-label leading-[22.5px] text-ink font-semibold group-hover:text-brand transition-colors">
              {title}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 style-caption font-semibold uppercase leading-[normal] tracking-[0.5px]"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-checked-text opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-checked-text"></span>
                </span>
              )}
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 style-caption leading-[16.8px] tracking-[0.2px] text-label-ink">
            <span>{meta}</span>

            {(hasRecording || (quizStatus && quizStatus !== "NONE")) && (
              <span className="text-ink-faint/40">•</span>
            )}

            {hasRecording && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5">
                🎥 Recording
              </span>
            )}

            {quizStatus === "PUBLISHED" && (
              <span className="inline-flex items-center text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200/60 rounded px-1.5 py-0.5">
                Quiz Active
              </span>
            )}

            {quizStatus === "DRAFT" && (
              <span className="inline-flex items-center text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5">
                Quiz Draft
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="pointer-events-none z-10 flex min-w-px flex-1 flex-col gap-[8px]">
        <div className="flex items-center justify-between">
          <span className="style-caption leading-[16.8px] tracking-[0.2px] text-label-ink">
            {leftInfo}
          </span>
          <span className="style-caption leading-[16.8px] tracking-[0.2px] text-label-ink">
            {rightInfo}
          </span>
        </div>
        <ProgressBar
          value={progress}
          trackColor="#ffffff99"
          fillColor={progressFill}
          height={9}
        />
      </div>

      {/* Action Buttons */}
      <div className="z-20 flex items-center gap-2">
        {actions.map((a) => {
          const buttonNode = (
            <Button
              variant={a.variant}
              size="sm"
              pill={a.pill}
              className="w-full rounded-[8px] lg:w-auto"
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
              className="flex-1 lg:flex-none"
              onClick={(e) => e.stopPropagation()}
            >
              {buttonNode}
            </Link>
          ) : (
            <div key={a.label} className="flex-1 lg:flex-none">
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