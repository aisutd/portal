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

function formatInChicago(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Fallback if already formatted

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function MobileAdminEvents({ stats, publishedRows, draftRows }: MobileAdminEventsProps) {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Events" />

      <div className="flex items-center justify-between">
        <h2 className="style-mobile-title text-ink">Events</h2>
        <Link href="/admin/events/new">
          <Button variant="primary" size="sm">+ New Event</Button>
        </Link>
      </div>

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

      {/* Published Events Section */}
      <div className="flex flex-col gap-[12px]">
        <h3 className="style-mobile-title text-ink">
          Published Events ({publishedRows.length})
        </h3>
        {publishedRows.length > 0 ? (
          publishedRows.map((e) => {
            const isLive = e.status?.label?.toUpperCase() === "LIVE";

            return (
              <div
                key={e.id}
                className={`flex flex-col gap-[10px] rounded-[16px] border p-[16px] transition-all ${
                  isLive
                    ? "border-emerald-500/80 bg-emerald-50/60 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-500/5"
                    : "border-border-soft bg-white"
                } ${e.dim ? "opacity-[0.72]" : ""}`}
              >
                <div className="flex items-center gap-[12px]">
                  <EventCoverImage
                    imageUrl={e.imageUrl ?? undefined}
                    className="h-[44px] w-[56px] shrink-0 rounded-[10px] bg-photo"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-[8px]">
                      <span className="style-mobile-body font-bold text-ink">
                        {e.title}
                      </span>
                      {e.status && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-[6px] px-[7px] py-[2px] style-caption font-semibold uppercase tracking-[0.5px]"
                          style={{ backgroundColor: e.status.bg, color: e.status.color }}
                        >
                          {isLive && (
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                          )}
                          {e.status.label}
                        </span>
                      )}
                    </div>
                    <span className="style-caption text-ink-faint">
                      {formatInChicago(e.meta)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between">
                    <span className="style-caption text-ink-faint">{e.leftInfo}</span>
                    <span className="style-caption text-ink-faint">{e.rightInfo}</span>
                  </div>
                  <ProgressBar value={e.progress} trackColor="#eceae2" fillColor={e.progressFill} height={8} />
                </div>

                <div className="flex gap-[8px]">
                  {e.actions.map((a) => {
                    const button = (
                      <Button variant={a.variant} size="sm" pill={a.pill} className="flex-1 rounded-[8px]">
                        {a.label}
                      </Button>
                    );
                    return a.href ? (
                      <Link key={a.label} href={a.href} className="flex-1">
                        {button}
                      </Link>
                    ) : (
                      <div key={a.label} className="flex-1">
                        {button}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[16px] border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
            No published events yet.
          </div>
        )}
      </div>

      {/* Draft Events Section */}
      <div className="flex flex-col gap-[12px] pt-2">
        <h3 className="style-mobile-title text-ink">
          Drafts ({draftRows.length})
        </h3>
        {draftRows.length > 0 ? (
          draftRows.map((e) => (
            <div
              key={e.id}
              className={`flex flex-col gap-[10px] rounded-[16px] border border-border-soft bg-white p-[16px] ${
                e.dim ? "opacity-[0.72]" : ""
              }`}
            >
              <div className="flex items-center gap-[12px]">
                <EventCoverImage imageUrl={e.imageUrl ?? undefined} className="h-11 w-14 shrink-0 rounded-[10px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className="style-mobile-body font-bold text-ink">
                      {e.title}
                    </span>
                    {e.status && (
                      <span
                        className="rounded-md px-[7px] py-[2px] style-caption font-medium uppercase tracking-[0.5px]"
                        style={{ backgroundColor: e.status.bg, color: e.status.color }}
                      >
                        {e.status.label}
                      </span>
                    )}
                  </div>
                  <span className="style-caption text-ink-faint">{e.meta}</span>
                </div>
              </div>

              <div className="flex flex-col gap-[6px]">
                <div className="flex items-center justify-between">
                  <span className="style-caption text-ink-faint">{e.leftInfo}</span>
                  <span className="style-caption text-ink-faint">{e.rightInfo}</span>
                </div>
                <ProgressBar value={e.progress} trackColor="#eceae2" fillColor={e.progressFill} height={8} />
              </div>

              <div className="flex gap-[8px]">
                {e.actions.map((a) => {
                  const button = (
                    <Button variant={a.variant} size="sm" pill={a.pill} className="flex-1 rounded-[8px]">
                      {a.label}
                    </Button>
                  );
                  return a.href ? (
                    <Link key={a.label} href={a.href} className="flex-1">
                      {button}
                    </Link>
                  ) : (
                    <div key={a.label} className="flex-1">
                      {button}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[16px] border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
            No draft events saved.
          </div>
        )}
      </div>

      <Link
        href="/admin/events/new"
        className="flex w-full flex-col gap-[4px] rounded-[16px] bg-brand px-[18px] py-[16px]"
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