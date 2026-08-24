import { Suspense } from "react";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils"; // <-- Added missing import
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
  userName: string;
  nextRsvp: Awaited<ReturnType<typeof getNextUpcomingRsvp>>;
};

export function MobileDashboard({ userId, userName, nextRsvp }: MobileDashboardProps) {
  // Compute glowing state in outer scope so it's accessible to the Card class list
  let isGlowing = false;

  if (nextRsvp) {
    const now = Date.now();
    const startTime = new Date(nextRsvp.event.startTime).getTime();
    const endTime = nextRsvp.event.endTime ? new Date(nextRsvp.event.endTime).getTime() : Infinity;

    // Starting within 30 mins or currently live
    const isStartingSoon = startTime - now <= 30 * 60 * 1000 && now <= endTime;
    isGlowing = Boolean(nextRsvp.isLive || isStartingSoon);
  }

  return (
    <MobileScreen>
      <h1 className="style-mobile-title text-brand">
        Welcome back, {userName}!
      </h1>

      {/* Up Next */}
      <Card
        className={cn(
          "flex flex-col gap-4 p-5 transition-all duration-300",
          isGlowing &&
            "border-green bg-checked/60 shadow-[0_0_20px_rgba(53,107,46,0.35)] ring-1 ring-green/50"
        )}
      >
        {nextRsvp ? (
          <>
            <div className="flex flex-col gap-1">
              <div className="mb-1 flex items-center justify-between">
                <p className="style-caption uppercase tracking-[2px] text-ink-faint">
                  {nextRsvp.isLive ? "Happening now" : `Up next · ${formatDaysAway(nextRsvp.event.startTime)}`}
                </p>
                <Badge label="RSVP'd" bg="#e1e8ff" color="#1f3aa3" />
              </div>

              <h3 className="style-mobile-title text-ink">
                {nextRsvp.event.title}
              </h3>
              <p className="style-mobile-body text-ink-muted">
                {formatEventDate(nextRsvp.event.startTime)}
              </p>
              <p className="style-mobile-body text-ink-muted">
                {nextRsvp.event.location}
              </p>
            </div>

            {nextRsvp.qrToken && (
              <div className="flex flex-col items-center gap-2">
                <p className="style-mobile-body text-ink">
                  Your Ticket: Claiming Items / Late Check-in
                </p>
                <div className="flex w-full items-center justify-center rounded-xl border border-ink bg-white p-4">
                  <div className="w-full max-w-70">
                    <QRCode
                      value={nextRsvp.qrToken}
                      size={256}
                      style={{ height: "fit", maxWidth: "100%", width: "100%" }}
                      level="H"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-[8px] rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6] p-[16px] text-center">
            <h3 className="style-mobile-title text-ink">
              No RSVPs yet
            </h3>
            <p className="style-mobile-body text-ink-muted">
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
            <span className="style-mobile-body text-ink-muted">
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