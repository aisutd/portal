"use client";

import { useEffect, useState } from "react";
import { Tag } from "@/components/ui/tag";
import { EventGridCard } from "@/components/events/event-grid-card";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { eventFilterTags } from "@/lib/data";
import { normalizeEventTags } from "@/lib/event-tags";

type EventRecord = {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  tags: string[];
};

function EventCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[14px] border border-border-soft bg-white p-[16px]">
      <div className="h-[80px] animate-pulse rounded-[10px] bg-[#efece3]" />
      <div className="mt-[10px] h-[14px] w-[70%] animate-pulse rounded-full bg-[#f4f1ea]" />
      <div className="mt-[8px] h-[34px] animate-pulse rounded-[8px] bg-[#f4f1ea]" />
    </div>
  );
}

export function MobileEventsBrowse() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      setLoading(true);
      try {
        const response = await fetch("/api/events", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load events: ${response.status}`);
        }
        const payload = (await response.json()) as EventRecord[];
        setEvents(Array.isArray(payload) ? payload : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setEvents([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEvents();
    return () => controller.abort();
  }, []);

  const filteredEvents = activeFilter
    ? events.filter((event) =>
        event.tags.some((tag) => tag.toLowerCase() === activeFilter)
      )
    : events;

  return (
    <MobileScreen>
      <div className="flex flex-col gap-[8px]">
        <h1 className="font-mobile-display text-[22px] font-bold text-ink">
          Pick Your Next Sidequest
        </h1>
        <p className="font-mobile-body text-[13px] text-ink-muted">
          Join us to learn, build, and connect with the AIS community
        </p>
      </div>

      {/* Filter pills */}
      <div className="-mx-[20px] flex gap-[8px] overflow-x-auto px-[20px] pb-[2px]">
        <button
          type="button"
          onClick={() => setActiveFilter(null)}
          className={
            activeFilter === null
              ? "shrink-0 rounded-full bg-brand px-[14px] py-[6px] font-mobile-body text-[12px] font-bold text-white"
              : "shrink-0 rounded-full border border-border-soft bg-white px-[14px] py-[6px] font-mobile-body text-[12px] font-bold text-ink-muted"
          }
        >
          All Events
        </button>
        {eventFilterTags.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setActiveFilter(t.label)}
            className="shrink-0"
          >
            {activeFilter === t.label ? (
              <Tag label={t.label} bg={t.bg} color={t.color} className="ring-2 ring-offset-1" />
            ) : (
              <Tag label={t.label} bg={t.bg} color={t.color} />
            )}
          </button>
        ))}
      </div>

      {/* Event grid */}
      <div className="grid grid-cols-1 gap-[16px]">
        {loading ? (
          <>
            <EventCardSkeleton />
            <EventCardSkeleton />
          </>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventGridCard
              key={event.id}
              title={event.title}
              meta={`${event.location} · ${new Date(event.startTime).toLocaleString()}`}
              description={event.description}
              tags={normalizeEventTags(event.tags)}
              eventId={event.id}
            />
          ))
        ) : (
          <div className="rounded-[14px] border border-border-soft bg-white p-[16px] font-mobile-body text-[13px] text-ink-muted">
            {activeFilter
              ? `No events tagged "${activeFilter}" right now.`
              : "No upcoming events right now."}
          </div>
        )}
      </div>

      <BottomNav />
    </MobileScreen>
  );
}
