import { Suspense } from "react";
import QRCode from "react-qr-code";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickCtaCard } from "@/components/dashboard/quick-cta-card";
import {
  DashboardApplicationsCard,
  ApplicationsCardSkeleton,
  DashboardRsvpsCard,
  RsvpsCardSkeleton,
  DashboardRecommendedCard,
} from "@/components/dashboard/server-cards";
import { formatDaysAway, formatEventDate, type getNextUpcomingRsvp } from "@/lib/dashboard-utils";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";

type MobileDashboardProps = {
  userId: string;
  userName: string; // <-- Added this
  nextRsvp: Awaited<ReturnType<typeof getNextUpcomingRsvp>>;
};

export function MobileDashboard({ userId, userName, nextRsvp }: MobileDashboardProps) {
  return (
    <MobileScreen>
      <h1 className="font-mobile-display text-[36px] font-bold text-brand">
        Welcome back, {userName}!
      </h1>

      {/* Up Next */}
      <Card className="flex flex-col gap-[16px] p-[20px]">
        {nextRsvp ? (
          <>
            <div className="flex flex-col gap-[4px]">
              <div className="mb-[4px] flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[2px] text-ink-faint">
                  Up next · {formatDaysAway(nextRsvp.event.startTime)}
                </p>
                <Badge label="RSVP'd" bg="#e1e8ff" color="#1f3aa3" />
              </div>
              
              <h3 className="font-mobile-display text-[20px] font-bold text-ink">
                {nextRsvp.event.title}
              </h3>
              <p className="font-mobile-body text-[14px] text-ink-muted">
                {formatEventDate(nextRsvp.event.startTime)}
              </p>
              <p className="font-mobile-body text-[14px] text-ink-muted">
                {nextRsvp.event.location}
              </p>
            </div>

            {nextRsvp.qrToken && (
              <div className="mt-[8px] flex w-full items-center justify-center rounded-[12px] border border-ink bg-white p-[24px]">
                <div className="w-full max-w-[280px]">
                  <QRCode
                    value={nextRsvp.qrToken}
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    level="H"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-[8px] rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6] p-[16px] text-center">
            <h3 className="font-mobile-display text-[15px] font-bold text-ink">
              No RSVPs yet
            </h3>
            <p className="font-mobile-body text-[13px] text-ink-muted">
              Check out upcoming events and RSVP to see them here.
            </p>
            <Button href="/events" variant="primary" size="sm" pill>
              Browse Events →
            </Button>
          </div>
        )}
      </Card>

      {/* Applications */}
      <Suspense fallback={<ApplicationsCardSkeleton />}>
        <DashboardApplicationsCard userId={userId} />
      </Suspense>

      {/* RSVPs */}
      <Suspense fallback={<RsvpsCardSkeleton />}>
        <DashboardRsvpsCard userId={userId} />
      </Suspense>

      <QuickCtaCard />

      {/* Recommended */}
      <Suspense
        fallback={
          <div className="flex min-h-[150px] items-center justify-center rounded-2xl bg-white">
            <span className="font-mobile-body text-[13px] text-ink-muted">
              Loading recommendations...
            </span>
          </div>
        }
      >
        <DashboardRecommendedCard userId={userId} />
      </Suspense>

      <BottomNav />
    </MobileScreen>
  );
}