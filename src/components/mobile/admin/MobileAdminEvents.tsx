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
      className={`flex flex-col gap-[10px] rounded-[16px] border p-[16px] transition-all ${
        isLive
          ? "border-green bg-white/60 ring-1 ring-green/20 shadow-md shadow-green/10"
          : "border-border-soft bg-white"
      } ${event.dim ? "opacity-[0.72]" : ""}`}
    >
      <div className="flex items-center gap-[12px]">
        <EventCoverImage
          imageUrl={event.imageUrl ?? undefined}
          className="h-[44px] w-[56px] shrink-0 rounded-[10px] bg-photo"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[8px]">
            <span className="style-mobile-body font-bold text-ink">
              {event.title}
            </span>
            {event.status && (
              <span
                className="inline-flex items-center gap-1.5 rounded-[6px] px-[7px] py-[2px] style-caption font-semibold uppercase tracking-[0.5px]"
                style={{
                  backgroundColor: event.status.bg,
                  color: event.status.color,
                }}
              >
                {isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                )}
                {event.status.label}
              </span>
            )}
          </div>
          <span className="style-caption text-ink-faint">{event.meta}</span>
        </div>
      </div>

      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center justify-between">
          <span className="style-caption text-ink-faint">
            {event.leftInfo}
          </span>
          <span className="style-caption text-ink-faint">
            {event.rightInfo}
          </span>
        </div>
        <ProgressBar
          value={event.progress}
          trackColor="#eceae2"
          fillColor={event.progressFill}
          height={8}
        />
      </div>

      <div className="flex gap-[8px]">
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