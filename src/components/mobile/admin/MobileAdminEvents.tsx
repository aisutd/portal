import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { eventStats, adminEvents } from "@/lib/data";

export function MobileAdminEvents() {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Events" />

      <div className="flex items-center justify-between">
        <h2 className="font-mobile-display text-[20px] font-bold text-ink">Events</h2>
        <Link href="/admin/events/new">
          <Button variant="primary" size="sm">+ New Event</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-[12px]">
        {eventStats.map((s) => (
          <div
            key={s.label}
            className={`flex flex-col gap-[4px] rounded-[14px] border bg-white px-[16px] py-[14px] ${
              s.highlight ? "border-brand" : "border-border-soft"
            }`}
          >
            <span
              className={`font-mobile-display text-[22px] font-bold ${
                s.highlight ? "text-brand" : "text-ink"
              }`}
            >
              {s.value}
            </span>
            <span className="font-mono text-[11px] text-ink-faint">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-[12px]">
        {adminEvents.map((e) => (
          <div
            key={e.title}
            className={`flex flex-col gap-[10px] rounded-[16px] border border-border-soft bg-white p-[16px] ${
              e.dim ? "opacity-[0.72]" : ""
            }`}
          >
            <div className="flex items-center gap-[12px]">
              <span className="h-[44px] w-[56px] shrink-0 rounded-[10px] bg-photo" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-[8px]">
                  <span className="font-mobile-body text-[13px] font-bold text-ink">
                    {e.title}
                  </span>
                  <span
                    className="rounded-[6px] px-[7px] py-[2px] font-mono text-[9.5px] font-medium uppercase tracking-[0.5px]"
                    style={{ backgroundColor: e.status.bg, color: e.status.color }}
                  >
                    {e.status.label}
                  </span>
                </div>
                <span className="font-mono text-[10.5px] text-ink-faint">{e.meta}</span>
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] text-ink-faint">{e.leftInfo}</span>
                <span className="font-mono text-[10.5px] text-ink-faint">{e.rightInfo}</span>
              </div>
              <ProgressBar value={e.progress} trackColor="#eceae2" fillColor={e.progressFill} height={8} />
            </div>

            <div className="flex gap-[8px]">
              {e.actions.map((a) => (
                <Button key={a.label} variant={a.variant} size="sm" pill={a.pill} className="flex-1 rounded-[8px]">
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/admin/events/new"
        className="flex w-full flex-col gap-[4px] rounded-[16px] bg-brand px-[18px] py-[16px]"
      >
        <span className="font-mobile-display text-[14px] font-bold text-white">
          + Create a new event
        </span>
        <span className="font-mono text-[10.5px] text-[#dfe6ff]">
          title · date · location · capacity · tags
        </span>
      </Link>
    </MobileScreen>
  );
}
