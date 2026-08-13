"use client";

import { useEffect, useState } from "react";
import { Tag } from "@/components/ui/tag";
import { EventGridCard } from "@/components/events/event-grid-card";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { eventFilterTags } from "@/lib/data";
import { formatEventCardDate, normalizeEventTags } from "@/lib/event-tags";

type EventRecord = {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  tags: string[];
  isRsvpd?: boolean;
};

interface MobileEventsBrowseProps {
  initialEvents: EventRecord[];
}

function EventCardSkeleton() {
  return (
    <div className="flex flex-col gap-[12px] rounded-[14px] border border-border-soft bg-white p-[16px] shadow-sm">
      <div className="h-[20px] w-[60%] animate-pulse rounded-[6px] bg-[#efece3]" />
      <div className="h-[14px] w-[40%] animate-pulse rounded-[4px] bg-[#f4f1ea]" />
      <div className="mt-[4px] flex flex-col gap-[8px]">
        <div className="h-[12px] w-full animate-pulse rounded-[4px] bg-[#f4f1ea]" />
        <div className="h-[12px] w-[85%] animate-pulse rounded-[4px] bg-[#f4f1ea]" />
      </div>
      <div className="mt-[4px] flex gap-[6px]">
        <div className="h-[24px] w-[60px] animate-pulse rounded-full bg-[#efece3]" />
        <div className="h-[24px] w-[80px] animate-pulse rounded-full bg-[#efece3]" />
      </div>
    </div>
  );
}

export function MobileEventsBrowse({ initialEvents }: MobileEventsBrowseProps) {
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track selected tags in an array for multi-select
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadEvents() {
      setError(null);
      try {
        const response = await fetch("/api/events", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load events: ${response.status}`);
        }
        const payload = (await response.json()) as EventRecord[];
        if (Array.isArray(payload)) {
          setEvents((prevEvents) =>
            payload.map((fetchedEvent) => {
              const matchingPrev = prevEvents.find((e) => e.id === fetchedEvent.id);
              return {
                ...fetchedEvent,
                isRsvpd: matchingPrev ? matchingPrev.isRsvpd : fetchedEvent.isRsvpd,
              };
            })
          );
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Unable to load events at this time.");
        }
      }
    }
    loadEvents();
    return () => controller.abort();
  }, []);

  // Toggle selection on click, deselect if already chosen
  const handleTagClick = (tagLabel: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagLabel)
        ? prev.filter((t) => t !== tagLabel)
        : [...prev, tagLabel]
    );
  };

  // Filter events: Event matches if it contains ALL selected tags
  const filteredEvents = selectedTags.length > 0
    ? events.filter((event) =>
        selectedTags.every((selectedTag) =>
          event.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())
        )
      )
    : events;

  return (
    <MobileScreen>
      <div className="flex flex-col gap-[6px]">
        <h1 className="font-mobile-display text-[24px] font-bold tracking-tight text-ink">
          Pick Your Next Sidequest
        </h1>
        <p className="font-mobile-body text-[14px] text-ink-muted">
          Join us to learn, build, and connect with the AIS community.
        </p>
      </div>

      <div className="-mx-[20px] flex snap-x snap-mandatory gap-[8px] overflow-x-auto px-[20px] py-[4px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* All Events resets selection state completely */}
        <button
          type="button"
          aria-pressed={selectedTags.length === 0}
          onClick={() => setSelectedTags([])}
          className={`shrink-0 snap-start rounded-full px-[16px] py-[8px] font-mobile-body text-[13px] font-bold transition-all duration-200 ${
            selectedTags.length === 0
              ? "bg-brand text-white shadow-sm"
              : "border border-border-soft bg-white text-ink-muted hover:bg-stone-soft"
          }`}
        >
          All Events
        </button>

        {eventFilterTags.map((t) => {
          const isSelected = selectedTags.includes(t.label);
          return (
            <button
              key={t.label}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleTagClick(t.label)}
              className="shrink-0 snap-start transition-transform active:scale-95"
            >
              {isSelected ? (
                <Tag
                  label={t.label}
                  bg={t.bg}
                  color={t.color}
                  className="ring-2 ring-brand/30 ring-offset-2 ring-offset-cream"
                />
              ) : (
                <Tag
                  label={t.label}
                  bg={t.bg}
                  color={t.color}
                  className="opacity-75 transition-opacity hover:opacity-100"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-[16px]">
        {loading ? (
          <>
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </>
        ) : error && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-danger-border bg-white p-[32px] text-center">
            <p className="font-mobile-display text-[16px] font-bold text-danger-ink">Oops!</p>
            <p className="mt-[4px] font-mobile-body text-[14px] text-ink-muted">{error}</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventGridCard
              key={event.id}
              title={event.title}
              meta={`${formatEventCardDate(event.startTime)} · ${event.location}`}
              description={event.description}
              tags={normalizeEventTags(event.tags)}
              eventId={event.id}
              isRsvpd={event.isRsvpd}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border-soft bg-white p-[40px] text-center shadow-sm">
            <p className="font-mobile-display text-[16px] font-bold text-ink">
              No events found
            </p>
            <p className="mt-[6px] font-mobile-body text-[14px] text-ink-muted">
              We couldn't find any upcoming events matching the selected filters.
            </p>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="mt-[16px] rounded-full bg-brand-soft px-[16px] py-[8px] font-mobile-body text-[13px] font-bold text-brand transition-colors hover:bg-brand hover:text-white"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </MobileScreen>
  );
}
