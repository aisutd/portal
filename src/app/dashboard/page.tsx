import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAuthenticatedUser } from "@/lib/auth";

// Components
import { Navbar } from "@/components/navbar";
import { UpNextCard } from "@/components/dashboard/up-next-card";
import { QuickCtaCard } from "@/components/dashboard/quick-cta-card";
import { AnnouncementsCard } from "@/components/dashboard/announcements-card";
import { MobileDashboard } from "@/components/mobile/dashboard/MobileDashboard";
import {
  DashboardApplicationsCard,
  ApplicationsCardSkeleton,
  DashboardRsvpsCard,
  RsvpsCardSkeleton,
  DashboardRecommendedCard,
} from "@/components/dashboard/server-cards";

// Lib & Data
import { getNextUpcomingRsvp, formatDaysAway, formatEventDate } from "@/lib/dashboard-utils";
import { announcements } from "@/lib/data";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  
  if (!user || !user.profile) {
    redirect("/onboarding/setup");
  }

  const nextRsvp = await getNextUpcomingRsvp(user.id);
  
  // Define it once, use it in both places
  const userName = user.profile.firstName || "Member";

  // Calculate if the current event is happening now or recently started
  const isPastEvent = nextRsvp ? new Date(nextRsvp.event.startTime) < new Date() : false;
  
  // Set dynamic eyebrow prefix text based on the event time status
  const eyebrowPrefix = isPastEvent ? "Happening Now / Recent" : "Up next";


  return (
    <>
      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden">
        <MobileDashboard 
          userId={user.id} 
          userName={userName} // <-- Passed here
          nextRsvp={nextRsvp} 
          announcements={announcements} 
        />
      </div>

      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar />

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[28px] px-[46px] pb-[46px] pt-[45px]">
            <h1 className="style-page-title leading-[43.2px] tracking-[-0.4px] text-brand [font-variation-settings:'wdth'_100]">
              Welcome back, {userName}!
            </h1>

            {/* Row 1 — featured event + applications */}
            <div className="mt-[28px] flex flex-col gap-[24px] xl:flex-row xl:items-start">
              {nextRsvp ? (
                <UpNextCard
                  eyebrow={nextRsvp.isLive ? "Happening now" : `Up next · ${formatDaysAway(nextRsvp.event.startTime)}`}
                  title={nextRsvp.event.title}
                  dateLines={[formatEventDate(nextRsvp.event.startTime), nextRsvp.event.location]}
                  tags={[
                    nextRsvp.isLive 
                      ? { "label": "LIVE", "bg": "#dcfce7", "color": "#166534" }
                      : { label: "RSVP'd", bg: "#e1e8ff", color: "#1f3aa3" }
                  ]}
                  qrToken={nextRsvp.qrToken}
                  isLive
                />
              ) : (
                <UpNextCard
                  isEmpty={true}
                  eyebrow="Up next"
                  title="No RSVPs yet"
                  dateLines={["Check out upcoming events and RSVP to see them here."]}
                />
              )}
              <Suspense fallback={<ApplicationsCardSkeleton />}>
                <DashboardApplicationsCard userId={user.id} />
              </Suspense>
            </div>

            {/* Row 2 — announcements + rsvps + cta */}
            <div className="flex flex-col gap-[24px] xl:h-[268px] xl:flex-row xl:items-stretch">
              <AnnouncementsCard items={announcements} />
              <Suspense fallback={<RsvpsCardSkeleton />}>
                <DashboardRsvpsCard userId={user.id} />
              </Suspense>
              <QuickCtaCard />
            </div>

            {/* Row 3 — recommendations */}
            <div className="flex flex-col gap-[24px] xl:flex-row xl:items-start">
              <Suspense fallback={<div className="flex min-h-[150px] flex-1 items-center justify-center rounded-2xl bg-white">Loading recommendations...</div>}>
                <DashboardRecommendedCard userId={user.id} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}