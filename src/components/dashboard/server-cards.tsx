import { Suspense } from "react";
import { StatusStrip, Stat } from "./status-strip";
import { ApplicationsCard, ApplicationItem } from "./applications-card";
import { RsvpsCard, RsvpItem } from "./rsvps-card";
import { getDashboardStats, getProfileCompletion, getMemberships, getApplications, getRSVPs, getUpcomingEvents } from "@/lib/dashboard-utils";
import { RecommendedCard, RecommendedItem } from "./recommended-card";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { PROGRAM_LABELS } from "@/lib/roles";

/* --- Skeletons --- */

export function StatusStripSkeleton() {
  return (
    <section className="flex w-full flex-wrap items-start justify-center gap-[16px]">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="flex min-w-[220px] flex-1 items-center gap-[12px] self-stretch px-[21px] py-[19px]">
          <div className="size-[10px] shrink-0 rounded-[5px] bg-gray-200 animate-pulse" />
          <div className="flex flex-col gap-[4px] w-full">
            <div className="h-[12px] w-[60px] bg-gray-200 animate-pulse rounded" />
            <div className="h-[20px] w-[80px] bg-gray-200 animate-pulse rounded" />
          </div>
        </Card>
      ))}
    </section>
  );
}

export function ApplicationsCardSkeleton() {
  return (
    <Card className="flex w-full shrink-0 flex-col gap-[16px] self-stretch p-[29px] xl:w-[440px]">
      <SectionHeader title="Your Applications" />
      <div className="flex flex-col gap-[16px]">
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-[10px]">
            <div className="flex items-center justify-between">
              <div className="h-[20px] w-[140px] bg-gray-200 animate-pulse rounded" />
              <div className="h-[24px] w-[60px] bg-gray-200 animate-pulse rounded-full" />
            </div>
            <div className="h-[8px] w-full bg-gray-200 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function RsvpsCardSkeleton() {
  return (
    <Card className="flex w-full shrink-0 self-stretch flex-col gap-[16px] xl:w-[360px] p-[29px]">
      <SectionHeader title="Your RSVPs" />
      <div className="flex flex-1 flex-col gap-[20px]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-[12px]">
            <div className="flex size-[48px] flex-col items-center justify-center rounded-[8px] bg-gray-200 animate-pulse" />
            <div className="flex flex-col gap-[4px]">
              <div className="h-[18px] w-[120px] bg-gray-200 animate-pulse rounded" />
              <div className="h-[14px] w-[160px] bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* --- Async Server Components --- */

export async function DashboardStatusStrip({ userId }: { userId: string }) {
  const [stats, profile, memberships] = await Promise.all([
    getDashboardStats(userId),
    getProfileCompletion(userId),
    getMemberships(userId),
  ]);

  const since = (date: Date) =>
    new Date(date).toLocaleDateString([], {timeZone: "America/Chicago", month: "short", year: "2-digit" });

  const statusStats: Stat[] = [
    {
      kind: "dot",
      label: "Membership",
      value: memberships.length
        ? memberships
            .map((m) => `${PROGRAM_LABELS[m.membershipType]} (${since(m.startDate)} - Present)`)
            .join(", ")
        : "Member",
      dotColor: memberships.length ? "#356b2e" : "#8a8a93",
    },
    {
      kind: "progress",
      label: "Events kept (sem)",
      value: `${stats.currentSemCount}`,
      percent: Math.min(100, (stats.currentSemCount / 5) * 100), // example denominator
      trackColor: "#e1e8ff",
      fillColor: "#2f5fe8",
    },
    {
      kind: "progress",
      label: "Profile complete",
      value: `${profile.percent}%`,
      percent: profile.percent,
      trackColor: "#fbe3cb",
      fillColor: "#f2a968",
    },
    {
      kind: "dot",
      label: "All Time Events",
      value: `${stats.allTime}`,
      dotColor: "#9f95c7",
    },
    {
      kind: "dot",
      label: "Past Sem Events",
      value: `${stats.pastSemCount}`,
      dotColor: "#ffbd59",
    },
  ];

  let banner = null;
  if (profile.missingFields.length > 0) {
    banner = (
      <div className="flex w-full items-center justify-between rounded-[8px] bg-[#f9d5d3] px-[21px] py-[12px]">
        <span className="style-body-text ">
          Your profile is incomplete. Missing: {profile.missingFields.join(", ")}.
        </span>
        <a href="/profile" className="style-caption font-bold  hover:underline">
          Complete Profile →
        </a>
      </div>
    );
  }

  return <StatusStrip stats={statusStats} banner={banner} />;
}

export async function DashboardApplicationsCard({ userId }: { userId: string }) {
  const apps = await getApplications(userId);

  const items: ApplicationItem[] = apps.map((sub) => {
    let statusLabel = sub.status.toString();
    let variant: "solid" | "outline" = "outline";
    let bg = "";
    let color = "";
    let percent = 20;

    switch (sub.status) {
      case "DRAFT":
        statusLabel = "Draft";
        percent = 30;
        break;
      case "SUBMITTED":
        statusLabel = "Submitted";
        variant = "solid";
        bg = "#e1e8ff";
        color = "#1f3aa3";
        percent = 50;
        break;
      case "IN_REVIEW":
        statusLabel = "In Review";
        variant = "solid";
        bg = "#fbe3cb";
        color = "#7a4416";
        percent = 70;
        break;
      case "ACCEPTED":
        statusLabel = "Accepted";
        variant = "solid";
        bg = "#d3eccf";
        color = "#356b2e";
        percent = 100;
        break;
      case "REJECTED":
        statusLabel = "Rejected";
        variant = "solid";
        bg = "#f9d5d3";
        color = "#9a3b36";
        percent = 100;
        break;
      default:
        statusLabel = sub.status;
        percent = 50;
    }

    return {
      title: sub.application.title,
      status: variant === "outline" ? { variant: "outline", label: statusLabel } : { variant: "solid", label: statusLabel, bg, color },
      percent,
      fillColor: variant === "solid" ? color : "#4f7bff",
    };
  });

  return <ApplicationsCard items={items} />;
}

export async function DashboardRsvpsCard({ userId }: { userId: string }) {
  const rsvps = await getRSVPs(userId, 5);

  const items: RsvpItem[] = rsvps.map((rsvp) => {
    const d = new Date(rsvp.event.startTime);
    return {
      id: rsvp.id,
      day: d.toLocaleDateString("en-US", { timeZone: 'America/Chicago', day: "2-digit"}),
      title: rsvp.event.title,
      detail: `${d.toLocaleTimeString([], { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' })} · ${rsvp.event.location}`,
      eventId: rsvp.eventId
    };
  });

  return <RsvpsCard items={items} />;
}

export async function DashboardRecommendedCard({ userId }: { userId: string }) {
  const events = await getUpcomingEvents(2, userId);

  const items: RecommendedItem[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    imageUrl: event.imageUrl,
    tags: [
      { label: "Upcoming", bg: "#e1e8ff", color: "#1f3aa3" },
    ],
  }));

  return <RecommendedCard items={items} />;
}
