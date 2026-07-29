import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { UpNextCard } from "@/components/dashboard/up-next-card";
import { getNextUpcomingRsvp } from "@/lib/dashboard-utils";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { QuickCtaCard } from "@/components/dashboard/quick-cta-card";
import { AnnouncementsCard } from "@/components/dashboard/announcements-card";
import {
  DashboardStatusStrip,
  StatusStripSkeleton,
  DashboardApplicationsCard,
  ApplicationsCardSkeleton,
  DashboardRsvpsCard,
  RsvpsCardSkeleton,
  DashboardRecommendedCard,
} from "@/components/dashboard/server-cards";
import {
  upNextTags,
  achievements,
  recommended,
  announcements,
} from "@/lib/data";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/onboarding");
  }

  let user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });

  if (!user) {
    // Fallback: Lazy create the user if the Clerk webhook didn't fire (common in local dev)
    const email = clerkUser.emailAddresses[0]?.emailAddress || "no-email@example.com";
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: email,
        role: "MEMBER",
      }
    });
  }

  const nextRsvp = await getNextUpcomingRsvp(user.id);

  // Helper to format days away
  const formatDaysAway = (date: Date) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return "recently";
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "tomorrow";
    return `in ${diffDays} days`;
  };

  // Helper to format date line
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-cream">
      <Navbar />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[28px] px-[46px] pb-[46px] pt-[45px]">
        <h1 className="font-display text-[40px] font-bold leading-[43.2px] tracking-[-0.4px] text-brand [font-variation-settings:'wdth'_100]">
          Welcome back, Member! :)
        </h1>


        {/* Row 1 — featured event + applications */}
        <div className="flex flex-col gap-[24px] xl:flex-row xl:items-start mt-[28px]">
          {nextRsvp ? (
            <UpNextCard
              eyebrow={`Up next · ${formatDaysAway(nextRsvp.event.startTime)}`}
              title={nextRsvp.event.title}
              dateLines={[formatDate(nextRsvp.event.startTime), nextRsvp.event.location]}
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
        <div className="flex flex-col gap-[24px] xl:flex-row xl:items-stretch xl:h-[268px]">
          <AnnouncementsCard items={announcements} />
          <Suspense fallback={<RsvpsCardSkeleton />}>
            <DashboardRsvpsCard userId={user.id} />
          </Suspense>
          <QuickCtaCard />
        </div>

        {/* Row 3 — recommendations + announcements */}
        <div className="flex flex-col gap-[24px] xl:flex-row xl:items-start">
          <Suspense fallback={<div className="flex flex-1 min-h-[150px] items-center justify-center bg-white rounded-2xl">Loading recommendations...</div>}>
            <DashboardRecommendedCard userId={user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
