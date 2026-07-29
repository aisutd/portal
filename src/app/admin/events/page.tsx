import type { Metadata } from "next";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { StatCard } from "@/components/admin/stat-card";
import { EventRow } from "@/components/admin/event-row";
import { Button } from "@/components/ui/button";
import { MobileAdminEvents } from "@/components/mobile/admin/MobileAdminEvents";
import { prisma } from "@/lib/prisma";
import type { EventRowData } from "@/components/admin/event-row";

export const metadata: Metadata = {
  title: "AIS Admin — Events",
  description: "Manage AIS events, RSVPs, and check-ins.",
};

function toDisplayStatus(startTime: Date, endTime: Date) {
  const now = new Date();
  if (now < startTime) return { label: "Upcoming", bg: "#e1e8ff", color: "#1f3aa3" };
  if (now > endTime) return { label: "Past", bg: "#efece3", color: "#8a8a93" };
  return { label: "Live", bg: "#d2ecd9", color: "#2c5d3e" };
}

async function getEventViewModel() {
  const [events, totalRsvps, checkedInCount] = await Promise.all([
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
    prisma.rSVP.count(),
    prisma.attendance.count(),
  ]);

  const now = new Date();
  const upcomingEvents = events.filter((event) => event.startTime > now);
  const pastOrCurrentEvents = events.filter((event) => event.startTime <= now);
  const totalCapacity = events.reduce((sum, event) => sum + (event.capacity ?? 0), 0);
  const totalCheckedIn = events.reduce(
    (sum, event) => sum + event.rsvps.filter((rsvp) => Boolean(rsvp.attendance)).length,
    0
  );
  const attendanceRatio = totalCapacity > 0 ? Math.round((totalCheckedIn / totalCapacity) * 100) : 0;

  const rows: EventRowData[] = events.map((event) => {
    const checkedInCountForEvent = event.rsvps.filter((rsvp) => Boolean(rsvp.attendance)).length;
    const capacity = event.capacity ?? 0;
    const progress = capacity > 0 ? Math.round((checkedInCountForEvent / capacity) * 100) : 0;
    const status = toDisplayStatus(event.startTime, event.endTime);

    return {
      id: event.id,
      title: event.title,
      status,
      meta: `${new Date(event.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · ${event.location}`,
      leftInfo: capacity > 0 ? `${checkedInCountForEvent} / ${capacity} checked in` : "No capacity set",
      rightInfo: `${event.rsvps.length} RSVPs`,
      progress,
      progressFill: now > event.endTime ? "#8a8a93" : "#2f5fe8",
      actions: [
        { label: "Edit", variant: "ghost", href: `/admin/events/${event.id}/edit` }, 
        { label: "Scan", variant: "primary", href: `/admin/events/${event.id}/scan` }, 
      ],
    };
  });

  return {
    stats: [
      { value: String(upcomingEvents.length), label: "upcoming" },
      { value: String(totalRsvps), label: "total RSVPs" },
      { value: String(checkedInCount), label: "checked in" },
      { value: `${attendanceRatio}%`, label: "avg capacity", highlight: true },
    ],
    rows,
    totalEvents: pastOrCurrentEvents.length,
  };
}

export default async function AdminEventsPage() {
  const data = await getEventViewModel();

  return (
    <>
      <div className="md:hidden">
        <MobileAdminEvents />
      </div>

      <div className="hidden md:block">
      <div className="flex min-h-screen w-full bg-cream">
        <AdminSidebar active="Events" role="Officer" />

        <div className="flex h-full flex-1 flex-col gap-[20px] p-[46px]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[32px] font-bold leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
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

          <div className="flex w-full flex-col gap-[12px]">
            {data.rows.map((e) => (
              <EventRow key={e.title} {...e} />
            ))}
          </div>

          <div className="flex w-full items-center justify-between rounded-[16px] bg-brand px-[23px] py-[21px]">
            <span className="font-display text-[17px] font-semibold leading-[21.25px] text-white [font-variation-settings:'wdth'_100]">
              + Create a new event
            </span>
            <span className="font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-[#dfe6ff]">
              title · date · location · capacity · tags
            </span>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
