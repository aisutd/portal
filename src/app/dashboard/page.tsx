import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAuthenticatedUser } from "@/lib/auth";

// Components
import { Navbar } from "@/components/navbar";
import { UpNextCard } from "@/components/dashboard/up-next-card";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
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
  // 1. Clean auth check using your new lib function
  const user = await getAuthenticatedUser();
  
  if (!user || !user.profile) {
    redirect("/onboarding/setup");
  }

  // 2. Fetch dashboard data
  const nextRsvp = await getNextUpcomingRsvp(user.id);

  // 3. Render
  return (
    <>
      <div className="md:hidden">
        <MobileDashboard userId={user.id} nextRsvp={nextRsvp} announcements={announcements} />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar />

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[28px] px-[46px] pb-[46px] pt-[45px]">
            <h1 className="font-display text-[40px] font-bold leading-[43.2px] tracking-[-0.4px] text-brand [font-variation-settings:'wdth'_100]">
              Welcome back, {user.profile.firstName || "Member"}! :)
            </h1>

            {/* Row 1 — featured event + applications */}
            <div className="mt-[28px] flex flex-col gap-[24px] xl:flex-row xl:items-start">
              {nextRsvp ? (
                <UpNextCard
                  eyebrow={`Up next · ${formatDaysAway(nextRsvp.event.startTime)}`}
                  title={nextRsvp.event.title}
                  dateLines={[formatEventDate(nextRsvp.event.startTime), nextRsvp.event.location]}
                  tags={[{ label: "RSVP'd", bg: "#e1e8ff", color: "#1f3aa3" }]}
                  qrToken={nextRsvp.qrToken}
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

            {/* Row 3 — recommendations + announcements */}
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