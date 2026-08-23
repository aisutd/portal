import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileAdminOverview } from "@/components/mobile/admin/MobileAdminOverview";
import {
  overviewStatsPrimary,
  overviewStatsSecondary,
  recentActivityWidths,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "AIS Admin — Overview",
  description: "Admin overview of applications, members, and events.",
};

export default function AdminOverviewPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileAdminOverview />
      </div>

      <div className="hidden md:block">
      <div className="flex min-h-screen w-full bg-cream">
        <AdminSidebar active="Overview" role="Officer" />

        <div className="flex h-full flex-1 flex-col gap-[24px] p-[46px]">
          <h2 className="style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
            Overview
          </h2>

          {/* Primary stats */}
          <div className="flex w-full gap-[16px]">
            {overviewStatsPrimary.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Secondary stats */}
          <div className="flex w-full gap-[16px]">
            {overviewStatsSecondary.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Review CTA + Recent activity */}
          <div className="flex w-full gap-[20px]">
            {/* Review CTA */}
            <div className="flex flex-1 flex-col gap-[12px] self-stretch rounded-[16px] bg-orange-soft p-[25px]">
              <div className="flex items-center justify-between">
                <h3 className="style-card-title leading-[21.25px] text-orange-ink [font-variation-settings:'wdth'_100]">
                  AIM Mentor
                </h3>
                <Badge label="5 new" bg="#fbe3cb" color="#7a4416" />
              </div>
              <p className="style-body-text leading-[20.3px] text-orange-ink">
                Applications waiting on your review.
              </p>
              <div>
                <Button variant="primary" size="sm" className="rounded-[8px]">
                  Review now →
                </Button>
              </div>
            </div>

            {/* Recent activity */}
            <div className="flex flex-1 flex-col gap-[12px] self-stretch rounded-[16px] border border-border-soft bg-white px-[25px] pb-[29px] pt-[24px]">
              <h3 className="style-card-title leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
                Recent activity
              </h3>
              <div className="flex flex-col gap-[8px]">
                {recentActivityWidths.map((w, i) => (
                  <span
                    key={i}
                    className="h-[10px] rounded-[6px] bg-skeleton"
                    style={{ width: w }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
