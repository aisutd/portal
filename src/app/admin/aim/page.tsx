export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { AdminAimShell } from "@/components/admin/aim-shell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getAdminViewer } from "@/lib/admin-access";

export const metadata: Metadata = {
  title: "AIS Admin — AIM",
  description: "Mentorship meetings and weekly attendance.",
};

async function getAimEvents() {
  const events = await prisma.event.findMany({
    where: {
      visibilityMembership: { hasSome: ["AIM_MENTOR", "AIM_MENTEE"] },
    },
    orderBy: { startTime: "desc" },
    include: {
      _count: { select: { attendances: true, rsvps: true } },
    },
  });

  const now = new Date();
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    location: event.location,
    startTime: event.startTime,
    isPast: event.endTime < now,
    isLive: event.startTime <= now && event.endTime >= now,
    attendedCount: event._count.attendances,
    rsvpCount: event._count.rsvps,
  }));
}

export default async function AdminAimPage() {
  const [events, viewer] = await Promise.all([getAimEvents(), getAdminViewer()]);
  const canManageEvents = !!viewer?.isAdmin;

  return (
    <AdminAimShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
            AIM Mentorship
          </h2>
          <p className="style-caption text-ink-faint">
            {canManageEvents
              ? <>Weekly meetings and attendance scanning. Create meetings from New Event with &quot;AIM Mentorship only&quot; checked.</>
              : "Weekly meetings and attendance scanning."}
          </p>
        </div>
        {canManageEvents && (
          <Link href="/admin/events/new">
            <Button variant="primary" size="md">
              + New Meeting
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-[12px]">
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
            No AIM-scoped meetings yet. Create an event and check &quot;AIM Mentorship only.&quot;
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-3 rounded-[16px] border border-border-soft bg-white p-[20px] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="style-card-title text-ink">{event.title}</span>
                  {event.isLive && (
                    <span className="rounded-full bg-[#d2ecd9] px-[10px] py-[2px] style-caption font-bold text-emerald-900">
                      Live
                    </span>
                  )}
                </div>
                <span className="style-caption text-ink-faint">
                  {new Intl.DateTimeFormat("en-US", {
                    timeZone: "America/Chicago",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(event.startTime)}{" "}
                  · {event.location} · {event.attendedCount}/{event.rsvpCount} checked in
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/aim/events/${event.id}/scan`}>
                  <Button variant="primary" size="sm">
                    Scan
                  </Button>
                </Link>
                {canManageEvents && (
                  <Link href={`/admin/events/${event.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminAimShell>
  );
}
