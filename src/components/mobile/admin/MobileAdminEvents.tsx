import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import type { StatCardData } from "@/components/admin/stat-card";
import type { EventRowData } from "@/components/admin/event-row";
import { EventCoverImage } from "@/components/events/event-cover-image";

type MobileAdminEventsProps = {
  stats: StatCardData[];
  publishedRows: EventRowData[];
  draftRows: EventRowData[];
  pastRows: EventRowData[];
};

/** Shared Card Component for Mobile Event Rows */
function MobileEventCard({ event }: { event: EventRowData }) {
  const isLive = event.status?.label?.toUpperCase() === "LIVE";

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl ring-[0.5px] p-5 transition-all ${
        isLive
          ? "bg-checked/60 ring-checked-text/15 shadow-md shadow-ink/10"
          : "ring-ink-faint/15 bg-white/60"
      } ${event.dim ? "opacity-[0.72]" : ""}`}
    >
      {/* Thumbnail + Title + Metadata */}
      <div className="flex items-center gap-4">
        {event.imageUrl ? (
          <EventCoverImage
            imageUrl={event.imageUrl}
            alt={event.title}
            className="h-[56px] w-[72px] shrink-0 rounded-[12px]"
          />
        ) : (
          <EventCoverImage
            imageUrl="/images/ais_logo_black-bg.jpg"
            alt={event.title}
            className="h-[56px] w-[72px] shrink-0 rounded-[12px]"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <div className="flex flex-wrap items-center gap-[10px]">
            <span className="style-label leading-[22.5px] text-ink font-semibold">
              {event.title}
            </span>
            {event.status && (
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 style-caption font-semibold uppercase leading-[normal] tracking-[0.5px]"
                style={{
                  backgroundColor: event.status.bg,
                  color: event.status.color,
                }}
              >
                {isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-checked-text opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-checked-text"></span>
                  </span>
                )}
                {event.status.label}
              </span>
            )}
          </div>
          <span className="style-caption leading-[16.8px] tracking-[0.2px] text-label-ink">
            {event.meta}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center justify-between">
          <span className="style-caption leading-[16.8px] tracking-[0.2px] text-label-ink">
            {event.leftInfo}
          </span>
          <span className="style-caption leading-[16.8px] tracking-[0.2px] text-label-ink">
            {event.rightInfo}
          </span>
        </div>
        <ProgressBar
          value={event.progress}
          trackColor="#ffffff99"
          fillColor={event.progressFill}
          height={9}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {event.actions.map((a) => {
          const buttonNode = (
            <Button
              variant={a.variant}
              size="sm"
              pill={a.pill}
              className="w-full flex-1 rounded-[8px]"
            >
              {a.label}
            </Button>
          );
          return a.href ? (
            <Link key={a.label} href={a.href} className="flex-1">
              {buttonNode}
            </Link>
          ) : (
            <div key={a.label} className="flex-1">
              {buttonNode}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MobileAdminEvents({
  stats,
  publishedRows,
  draftRows,
  pastRows,
}: MobileAdminEventsProps) {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Events" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="style-mobile-title text-ink">Events</h2>
        <Link href="/admin/events/new">
          <Button variant="primary" size="sm">
            + New Event
          </Button>
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-[12px]">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`flex flex-col gap-[4px] rounded-[14px] border bg-white px-[16px] py-[14px] ${
              s.highlight ? "border-brand" : "border-border-soft"
            }`}
          >
            <span
              className={`style-mobile-title ${
                s.highlight ? "text-brand" : "text-ink"
              }`}
            >
              {s.value}
            </span>
            <span className="style-caption text-ink-faint">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Published Events */}
      <div className="flex flex-col gap-[12px]">
        <h3 className="style-mobile-title text-ink">
          Published Events ({publishedRows.length})
        </h3>
        {publishedRows.length > 0 ? (
          publishedRows.map((e) => <MobileEventCard key={e.id} event={e} />)
        ) : (
          <div className="rounded-[16px] border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
            No active or upcoming published events.
          </div>
        )}
      </div>

      {/* Draft Events */}
      <div className="flex flex-col gap-[12px] pt-2">
        <h3 className="style-mobile-title text-ink">
          Drafts ({draftRows.length})
        </h3>
        {draftRows.length > 0 ? (
          draftRows.map((e) => <MobileEventCard key={e.id} event={e} />)
        ) : (
          <div className="rounded-[16px] border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
            No draft events saved.
          </div>
        )}
      </div>

      {/* Past Events */}
      <div className="flex flex-col gap-[12px] pt-2">
        <h3 className="style-mobile-title text-ink-muted">
          Past Events ({pastRows.length})
        </h3>
        {pastRows.length > 0 ? (
          pastRows.map((e) => <MobileEventCard key={e.id} event={e} />)
        ) : (
          <div className="rounded-[16px] border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
            No past events recorded.
          </div>
        )}
      </div>

      {/* Quick Action Link */}
      <Link
        href="/admin/events/new"
        className="flex w-full flex-col gap-[4px] rounded-[16px] bg-brand px-[18px] py-[16px] transition-opacity hover:opacity-95"
      >
        <span className="style-mobile-title text-white">
          + Create a new event
        </span>
        <span className="style-caption text-white/80">
          title · date · location · capacity · tags
        </span>
      </Link>
    </MobileScreen>
  );
}