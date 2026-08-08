export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Tag } from "@/components/ui/tag";
import { EventGridCard } from "@/components/events/event-grid-card";
import { MobileEventsBrowse } from "@/components/mobile/events/MobileEventsBrowse";
import { eventFilterTags } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Events — Browse",
  description: "Browse upcoming AIS events by tag.",
};

async function getEvents() {
  return prisma.event.findMany({
    orderBy: { startTime: "asc" },
    take: 20,
  });
}

export default async function EventsBrowsePage() {
  const events = await getEvents();

  return (
    <>
      <div className="md:hidden">
        <MobileEventsBrowse />
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
                {events.map((event) => (
                  <EventGridCard
                    key={event.id}
                    title={event.title}
                    meta={`${event.location} · ${new Date(event.startTime).toLocaleString()}`}
                    description={event.description}
                    tags={event.tags}
                    eventId={event.id}
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