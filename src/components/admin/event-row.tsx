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
      className={`flex w-full items-center gap-5 rounded-2xl ring-[0.5px] p-5 transition-all ${
        isLive
          ? "bg-checked/60 ring-checked-text/15 shadow-md shadow-ink/10"
          : "ring-ink-faint/15 bg-white/60"
      } ${dim ? "opacity-[0.72]" : ""}`}
    >
      {/* Thumbnail */}
      {(imageUrl ? 
        <EventCoverImage
          imageUrl={imageUrl}
          alt={title}
          className="h-[56px] w-[72px] shrink-0 rounded-[12px]"
        /> :
        <EventCoverImage
          imageUrl={`/images/ais_logo_black-bg.jpg`}
          alt={title}
          className="h-[56px] w-[72px] shrink-0 rounded-[12px]"
        />
      )}

      {/* Title + schedule */}
      <div className="flex min-w-[250px] shrink-0 flex-col gap-[5px]">
        <div className="flex items-center gap-[10px]">
          <span className="style-label leading-[22.5px] text-ink font-semibold">
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
        <span className="style-caption leading-[16.8px] tracking-[0.2px] text-label-ink">
          {meta}
        </span>
      </div>

      {/* Progress */}
      <div className="flex min-w-px flex-1 flex-col gap-[8px]">
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