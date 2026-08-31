export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { StatCard } from "@/components/admin/stat-card";
import { EventRow } from "@/components/admin/event-row";
import { Button } from "@/components/ui/button";
import { MobileAdminEvents } from "@/components/mobile/admin/MobileAdminEvents";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { EventRowData } from "@/components/admin/event-row";

export const metadata: Metadata = {
  title: "AIS Admin — Events",
  description: "Manage AIS events, RSVPs, and check-ins.",
};

type EventWithRsvps = Prisma.EventGetPayload<{
  include: { rsvps: { include: { attendance: true } } };
}>;

function toDisplayStatus(event: { startTime: Date; endTime: Date; isPublished: boolean }) {
  if (!event.isPublished) {
    return { label: "Draft", bg: "#f3f4f6", color: "#4b5563" };
  }
  const now = new Date();
  if (now < new Date(event.startTime)) return { label: "Upcoming", bg: "#e1e8ff", color: "#1f3aa3" };
  if (now > new Date(event.endTime)) return { label: "Past", bg: "#efece3", color: "#8a8a93" };
  return { label: "Live", bg: "#d2ecd9", color: "#2c5d3e" };
}

// Helper to convert an event into an EventRowData item
function mapEventToRow(event: EventWithRsvps): EventRowData {
  const now = new Date();
  const isPast = new Date(event.endTime) < now;

  // 1. Filter out cancelled RSVPs
  // NOTE: Adjust `rsvp.status === "GOING"` (or `!rsvp.isCancelled`) to match your Prisma schema
  const activeRsvps = event.rsvps.filter(
    (rsvp: any) => rsvp.status !== "CANCELED" && !rsvp.isCancelled
  );

  const checkedInCountForEvent = activeRsvps.filter((rsvp: any) => Boolean(rsvp.attendance)).length;
  const capacity = event.capacity ?? 0;
  const progress = capacity > 0 ? Math.round((checkedInCountForEvent / capacity) * 100) : 0;
  const baseStatus = toDisplayStatus(event);

  // Deterministic date formatting for Server Components
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.startTime));

  return {
    id: event.id,
    imageUrl: event.imageUrl,
    title: event.title,
    status: baseStatus,
    meta: `${formattedDate} · ${event.location}`,
    leftInfo: capacity > 0 ? `${checkedInCountForEvent} / ${capacity} checked in` : "No capacity set",
    rightInfo: `${activeRsvps.length} RSVPs`, // <-- Uses active count only
    progress,
    progressFill: isPast ? "#8a8a93" : "#2f5fe8",
    dim: isPast,
    actions: [
      { label: "QR", variant: "primary", href: `/admin/events/${event.id}/check-in` },
      { label: "Scan", variant: "primary", href: `/admin/events/${event.id}/scan` },
      { label: "RSVPs", variant: "accent", href: `/admin/events/${event.id}/rsvps` },
      { label: "Edit", variant: "ghost", href: `/admin/events/${event.id}/edit` },
    ],
  };
}

async function getEventViewModel() {
  const now = new Date();

  const [events, totalRsvps] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startTime: "asc" },
      include: {
        rsvps: {
          include: {
            attendance: true,
          },
        },
      },
    }),
    // 2. Filter total count query to active RSVPs only
    prisma.rSVP.count({
      where: {
        // Adjust filter based on your RSVP model status field:
        // status: "GOING" 
        // OR isCancelled: false
        NOT: { status: "CANCELED" },
      },
    }),
  ]);

  const publishedEvents = events.filter((event) => event.isPublished);
  const draftEvents = events.filter((event) => !event.isPublished);

  const liveEvents = publishedEvents.filter((e) => new Date(e.startTime) <= now && new Date(e.endTime) >= now);
  const upcomingEvents = publishedEvents.filter((e) => new Date(e.startTime) > now);
  const pastEvents = publishedEvents.filter((e) => new Date(e.endTime) < now);

  const activePublishedEvents = [...liveEvents, ...upcomingEvents];

  const totalCapacity = events.reduce((sum, event) => sum + (event.capacity ?? 0), 0);
  const totalCheckedIn = events.reduce(
    (sum, event) =>
      sum +
      event.rsvps.filter(
        (rsvp: any) => (rsvp.status !== "CANCELED" && !rsvp.isCancelled) && Boolean(rsvp.attendance)
      ).length,
    0
  );
  const attendanceRatio = totalCapacity > 0 ? Math.round((totalCheckedIn / totalCapacity) * 100) : 0;

  return {
    stats: [
      { value: String(publishedEvents.length), label: "published" },
      { value: String(draftEvents.length), label: "drafts" },
      { value: String(totalRsvps), label: "total RSVPs" },
      { value: `${attendanceRatio}%`, label: "avg capacity", highlight: true },
    ],
    publishedRows: activePublishedEvents.map(mapEventToRow),
    draftRows: draftEvents.map(mapEventToRow),
    pastRows: pastEvents.map(mapEventToRow),
  };
}

export default async function AdminEventsPage() {
  const data = await getEventViewModel();

  return (
    <>
      <div className="md:hidden">
        <MobileAdminEvents 
          stats={data.stats} 
          publishedRows={data.publishedRows} 
          draftRows={data.draftRows}
          pastRows={data.pastRows}
        />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full bg-cream">
          <AdminSidebar active="Events" />

          <div className="flex h-full flex-1 flex-col gap-[28px] p-[46px]">
            <div className="flex items-center justify-between">
              <h2 className="style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                Events
              </h2>
              <div className="flex items-center gap-[10px]">
                <Button variant="soft" size="sm" className="rounded-[8px]">
                  List
                </Button>
                <Button variant="ghost" size="sm" className="rounded-[8px]">
                  Calendar
                </Button>
                <Link href="/admin/events/new">
                  <Button variant="primary" size="md">
                    + New Event
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex w-full gap-[16px]">
              {data.stats.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>

            {/* Published Events Section */}
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <h3 className="style-section-header text-ink">
                  Published Events ({data.publishedRows.length})
                </h3>
              </div>
              {data.publishedRows.length > 0 ? (
                data.publishedRows.map((e) => <EventRow key={e.id} {...e} />)
              ) : (
                <p className="rounded-xl border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
                  No active or upcoming published events.
                </p>
              )}
            </div>

            {/* Draft Events Section */}
            <div className="flex flex-col gap-[12px] pt-4">
              <div className="flex items-center justify-between">
                <h3 className="style-section-header text-ink">
                  Drafts ({data.draftRows.length})
                </h3>
              </div>
              {data.draftRows.length > 0 ? (
                data.draftRows.map((e) => <EventRow key={e.id} {...e} />)
              ) : (
                <p className="rounded-xl border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
                  No draft events saved.
                </p>
              )}
            </div>

            {/* Past Events Section */}
            <div className="flex flex-col gap-[12px] pt-4">
              <div className="flex items-center justify-between">
                <h3 className="style-section-header text-ink-muted">
                  Past Events ({data.pastRows.length})
                </h3>
              </div>
              {data.pastRows.length > 0 ? (
                <div className="flex flex-col gap-[12px]">
                  {data.pastRows.map((e) => <EventRow key={e.id} {...e} />)}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
                  No past events recorded.
                </p>
              )}
            </div>

            <Link href="/admin/events/new" className="mt-2 block w-full">
              <div className="flex w-full items-center justify-between rounded-[16px] bg-brand px-[23px] py-[21px] transition-opacity hover:opacity-95">
                <span className="style-section-header leading-[21.25px] text-white [font-variation-settings:'wdth'_100]">
                  + Create a new event
                </span>
                <span className="style-caption leading-[16.8px] tracking-[0.2px] text-white/80">
                  title · date · location · capacity · tags
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}