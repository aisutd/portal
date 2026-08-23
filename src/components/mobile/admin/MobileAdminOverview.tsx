import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import {
  overviewStatsPrimary,
  overviewStatsSecondary,
  recentActivityWidths,
} from "@/lib/data";

export function MobileAdminOverview() {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Overview" />

      <h2 className="style-mobile-title text-ink">Overview</h2>

      <div className="grid grid-cols-2 gap-[12px]">
        {[...overviewStatsPrimary, ...overviewStatsSecondary].map((s) => (
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

      <div className="flex flex-col gap-[12px] rounded-[16px] bg-orange-soft p-[18px]">
        <div className="flex items-center justify-between">
          <h3 className="style-mobile-title text-orange-ink">
            AIM Mentor
          </h3>
          <Badge label="5 new" bg="#fbe3cb" color="#7a4416" />
        </div>
        <p className="style-mobile-body text-orange-ink">
          Applications waiting on your review.
        </p>
        <Button href="/admin/applications/1" variant="primary" size="sm" className="self-start rounded-[8px]">
          Review now →
        </Button>
      </div>

      <div className="flex flex-col gap-[12px] rounded-[16px] border border-border-soft bg-white p-[18px]">
        <h3 className="style-mobile-title text-ink">Recent activity</h3>
        <div className="flex flex-col gap-[8px]">
          {recentActivityWidths.map((w, i) => (
            <span key={i} className="h-[10px] rounded-[6px] bg-skeleton" style={{ width: w }} />
          ))}
        </div>
      </div>
    </MobileScreen>
  );
}
