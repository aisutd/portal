export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Tag } from "@/components/ui/tag";
import { EventGridCard } from "@/components/events/event-grid-card";
import { MobileEventsBrowse } from "@/components/mobile/events/MobileEventsBrowse";
import { eventFilterTags } from "@/lib/data";
import { formatEventCardDate } from "@/lib/event-tags";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Events — Browse",
  description: "Browse upcoming AIS events by tag.",
};

async function getEvents(userId: string | null) {
  return prisma.event.findMany({
    orderBy: { startTime: "asc" },
    take: 20,
    include: {
      rsvps: userId
        ? {
            where: {
              userId: userId,
              status: "GOING",
            },
          }
        : false,
    },
  });
}

export default async function EventsBrowsePage() {
  const user = await getAuthenticatedUser();
  const userId = user?.id ?? null;
  const events = await getEvents(userId);

  // Map events to include userIsGoing flag for client-side use
  const initialEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startTime: event.startTime.toISOString(), // Ensure ISO string format for client dates
    tags: event.tags,
    isRsvpd: !!(event.rsvps && event.rsvps.length > 0),
  }));

  return (
    <>
      <div className="md:hidden">
        <MobileEventsBrowse initialEvents={initialEvents} />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar active="Events" />
          <div className="flex w-full flex-col md:flex-row md:items-stretch">
            {/* Tag filter sidebar */}
            <aside className="flex flex-col gap-[10px] border-b border-border-soft px-[26px] py-[32px] md:w-[219px] md:shrink-0 md:border-b-0 md:border-r">
              <p className="font-techno text-[12px] uppercase leading-[normal] tracking-[3px] text-ink-faint">
                Tags
              </p>
              <div className="flex flex-wrap gap-[10px] md:flex-col md:items-start">
                {eventFilterTags.map((t) => (
                  <Tag key={t.label} label={t.label} bg={t.bg} color={t.color} />
                ))}
              </div>
            </aside>

            {/* Event grid */}
            <div className="min-w-px flex-1 p-[46px]">
              <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-2">
                {initialEvents.map((event) => (
                  <EventGridCard
                    key={event.id}
                    title={event.title}
                    meta={`${formatEventCardDate(event.startTime)} · ${event.location}`}
                    description={event.description}
                    tags={event.tags}
                    eventId={event.id}
                    isRsvpd={event.isRsvpd}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
