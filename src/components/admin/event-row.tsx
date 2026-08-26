import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EventCoverImage } from "../events/event-cover-image";

type EventStatus = { label: string; bg: string; color: string };
type EventAction = {
  label: string;
  variant: "primary" | "accent" | "ghost";
  pill?: boolean;
  href?: string;
};

export type EventRowData = {
  id: string;
  imageUrl: string | null;
  title: string;
  status: EventStatus;
  /** "Aug 27 · 7:00 PM · ECSW 1.315" */
  meta: string;
  leftInfo: string;
  rightInfo: string;
  progress: number;
  progressFill: string;
  dim?: boolean;
  actions: EventAction[];
};

export function EventRow({
  title,
  imageUrl,
  status,
  meta,
  leftInfo,
  rightInfo,
  progress,
  progressFill,
  dim,
  actions,
}: EventRowData) {
  const isLive = status?.label?.toUpperCase() === "LIVE";

  return (
    <div
      className={`flex w-full items-center gap-[20px] rounded-[16px] border px-[21px] py-[19px] transition-all ${
        isLive
          ? "border-green bg-white/60 ring-1 ring-green/20 shadow-md shadow-green/10"
          : "border-border-soft bg-white"
      } ${dim ? "opacity-[0.72]" : ""}`}
    >
      {/* Thumbnail */}
      <EventCoverImage
        className="h-[56px] w-[72px] shrink-0 rounded-[12px]"
        imageUrl={imageUrl}
      />

      {/* Title + schedule */}
      <div className="flex min-w-[250px] shrink-0 flex-col gap-[5px]">
        <div className="flex items-center gap-[10px]">
          <span className="style-body-text leading-[22.5px] text-ink font-semibold">
            {title}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-[6px] px-[9px] py-[3px] style-caption font-semibold uppercase leading-[normal] tracking-[0.5px]"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            {isLive && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
            )}
            {status.label}
          </span>
        </div>
        <span className="style-caption leading-[16.8px] tracking-[0.2px] text-ink-faint">
          {meta}
        </span>
      </div>

      {/* Progress */}
      <div className="flex min-w-px flex-1 flex-col gap-[8px]">
        <div className="flex items-center justify-between">
          <span className="style-caption leading-[16.8px] tracking-[0.2px] text-ink-faint">
            {leftInfo}
          </span>
          <span className="style-caption leading-[16.8px] tracking-[0.2px] text-ink-faint">
            {rightInfo}
          </span>
        </div>
        <ProgressBar
          value={progress}
          trackColor="#eceae2"
          fillColor={progressFill}
          height={9}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {actions.map((a) => {
          const buttonNode = (
            <Button
              variant={a.variant}
              size="sm"
              pill={a.pill}
              className="rounded-[8px]"
            >
              {a.label}
            </Button>
          );

          return a.href ? (
            <Link key={a.label} href={a.href}>
              {buttonNode}
            </Link>
          ) : (
            <div key={a.label}>{buttonNode}</div>
          );
        })}
      </div>
    </div>
  );
}