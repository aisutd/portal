import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateCalendarLinks } from "@/lib/calendar";

// Components
import { Navbar } from "@/components/navbar";
import { UpNextCard } from "@/components/dashboard/up-next-card";
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

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  
  if (!user || !user.profile) {
    redirect("/onboarding/setup");
  }

  const nextRsvp = await getNextUpcomingRsvp(user.id);
  const userName = user.profile.firstName || "Member";

  // Event has concluded only if endTime is in the past
  const isPastEvent = nextRsvp ? new Date(nextRsvp.event.endTime) < new Date() : false;
  
  let calendarLinksObj = null;
  if (nextRsvp) {
    calendarLinksObj = generateCalendarLinks({
      id: nextRsvp.event.id,
      title: nextRsvp.event.title,
      description: nextRsvp.event.description,
      location: nextRsvp.event.location,
      startTime: nextRsvp.event.startTime,
      endTime: nextRsvp.event.endTime,
      userId: user.id,
    });
  }

  return (
    <>
      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden">
        <MobileDashboard 
          userId={user.id} 
          userName={userName}
          nextRsvp={nextRsvp} 
          calendarLinks={calendarLinksObj}
        />
      </div>

      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:block">
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-cream">
          {/* Ambient accent glow, purely decorative */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-[12%] -z-10 h-[420px] w-[420px] rounded-full bg-orange-300/25 blur-[110px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 right-[8%] -z-10 h-[380px] w-[380px] rounded-full bg-purple-400/20 blur-[110px]"
          />

          <Navbar />

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[28px] px-[46px] pb-[46px] pt-[45px]">
            <h1 className="style-page-title /*leading-[43.2px] tracking-[-0.4px] [font-variation-settings:'wdth'_100]*/ bg-[linear-gradient(90deg,#f2a968_0%,#7d64c4_100%)] bg-clip-text text-transparent">
              Welcome back, {userName}!
            </h1>

            {/* Row 1 — featured event + applications */}
            <div className="mt-[28px] flex flex-col gap-[24px] xl:flex-row xl:items-start">
              {nextRsvp ? (
                <UpNextCard
                  eyebrow={nextRsvp.isLive ? "Happening now" : `${formatDaysAway(nextRsvp.event.startTime)}`}
                  title={nextRsvp.event.title}
                  imageUrl={nextRsvp.event.imageUrl}                  
                  dateLines={[formatEventDate(nextRsvp.event.startTime), nextRsvp.event.location]}
                  tags={[
                    nextRsvp.isLive 
                      ? { label: "LIVE", bg: "#dcfce7", color: "#166534" }
                      : { label: "RSVP'd", bg: "#e1e8ff", color: "#1f3aa3" }
                  ]}
                  qrToken={nextRsvp.qrToken}
                  isLive={!!nextRsvp.isLive}
                  calendarLinks={calendarLinksObj}
                />
              ) : (
                <UpNextCard
                  isEmpty={true}
                  imageUrl={null}
                  eyebrow="Up next"
                  title="No RSVPs yet"
                  dateLines={["Check out upcoming events and RSVP to see them here."]}
                />
              )}
              <Suspense fallback={<RsvpsCardSkeleton />}>
                <DashboardRsvpsCard userId={user.id} />
              </Suspense>
              
              
            </div>

            {/* Row 2 — recommended & browse events card + RSVPs */}
            <div className="flex flex-col gap-[24px] xl:flex-row xl:items-stretch">
              <Suspense fallback={<div className="flex min-h-[200px] flex-1 items-center justify-center rounded-2xl bg-white">Loading recommendations...</div>}>
                <DashboardRecommendedCard userId={user.id} />
              </Suspense>
              <Suspense fallback={<ApplicationsCardSkeleton />}>
                <DashboardApplicationsCard userId={user.id} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}