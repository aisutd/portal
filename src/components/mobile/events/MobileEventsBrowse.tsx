"use client";

import { useEffect, useState } from "react";
import { Tag } from "@/components/ui/tag";
import { EventGridCard } from "@/components/events/event-grid-card";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { eventFilterTags } from "@/lib/data";
import { normalizeEventTags } from "@/lib/event-tags";
import { formatEventDate } from "@/lib/utils";

type EventRecord = {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime?: string | null;
  imageUrl?: string | null;
  tags: string[];
  isRsvpd?: boolean;
  hasAttended?: boolean;
  missedEvent?: boolean;
};

interface MobileEventsBrowseProps {
  upcomingEvents: EventRecord[];
  pastEvents: EventRecord[];
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

export function MobileEventsBrowse({ upcomingEvents: initialUpcoming, pastEvents: initialPast }: MobileEventsBrowseProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<EventRecord[]>(initialUpcoming);
  const [pastEvents, setPastEvents] = useState<EventRecord[]>(initialPast);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Sync state whenever props from server update
  useEffect(() => {
    setUpcomingEvents(initialUpcoming);
    setPastEvents(initialPast);
  }, [initialUpcoming, initialPast]);

  const handleTagClick = (tagLabel: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagLabel)
        ? prev.filter((t) => t !== tagLabel)
        : [...prev, tagLabel]
    );
  };

  const filterList = (list: EventRecord[]) => 
    selectedTags.length > 0
      ? list.filter((event) =>
          selectedTags.every((selectedTag) =>
            (event.tags || []).some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())
          )
        )
      : list;

  const filteredUpcoming = filterList(upcomingEvents).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  const filteredPast = filterList(pastEvents).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const totalFilteredCount = filteredUpcoming.length + filteredPast.length;

  return (
    <MobileScreen>
      <div className="flex flex-col gap-[6px]">
        <h1 className="style-page-title leading-tight tracking-tight text-brand">
          Pick Your Next Sidequest
        </h1>
        <p className="style-page-subtitle text-ink-muted">
          Join us to learn, build, and connect with the AIS community
        </p>
      </div>

      <div className="flex snap-x snap-mandatory gap-[8px] overflow-x-auto py-[6px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          aria-pressed={selectedTags.length === 0}
          onClick={() => setSelectedTags([])}
          className={`shrink-0 snap-start rounded-full px-[16px] py-[8px] font-sans font-bold transition-all duration-200 ${
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

      <div className="flex flex-col gap-[28px]">
        {loading ? (
          <div className="grid grid-cols-1 gap-[16px]">
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : error && totalFilteredCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-danger-border bg-white p-[32px] text-center">
            <p className="font-sans font-bold text-danger-ink">Oops!</p>
            <p className="mt-[4px] font-sans font-normal text-ink-muted">{error}</p>
          </div>
        ) : totalFilteredCount > 0 ? (
          <>
            {filteredUpcoming.length > 0 && (
              <div className="flex flex-col gap-[16px]">
                <h2 className="style-mobile-title text-ink">
                  Upcoming Events
                </h2>
                <div className="grid grid-cols-1 gap-[16px]">
                  {filteredUpcoming.map((event) => (
                    <EventGridCard
                      key={event.id}
                      title={event.title}
                      meta={`${formatEventDate(event.startTime)} · ${event.location}`}
                      description={event.description}
                      imageUrl={event.imageUrl}
                      tags={normalizeEventTags(event.tags)}
                      eventId={event.id}
                      isRsvpd={event.isRsvpd}
                      isPast={false}
                      hasAttended={event.hasAttended} // 👈 FIXED: Added hasAttended
                      missedEvent={event.missedEvent} // 👈 FIXED: Added missedEvent
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredPast.length > 0 && (
              <div className="flex flex-col gap-[16px]">
                <h2 className="style-mobile-title text-ink-muted">
                  Past Events
                </h2>
                <div className="grid grid-cols-1 gap-[16px] opacity-80">
                  {filteredPast.map((event) => (
                    <EventGridCard
                      key={event.id}
                      title={event.title}
                      meta={`${formatEventDate(event.startTime)} · ${event.location}`}
                      description={event.description}
                      imageUrl={event.imageUrl}
                      tags={normalizeEventTags(event.tags)}
                      eventId={event.id}
                      isRsvpd={event.isRsvpd}
                      isPast={true}
                      hasAttended={event.hasAttended}
                      missedEvent={event.missedEvent}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border-soft bg-white p-[40px] text-center shadow-sm">
            <p className="font-sans font-bold text-ink">
              No events found
            </p>
            <p className="mt-[6px] font-sans text-ink-muted">
              We didn&apos;t have any events with the selected filters. Look out in the near future!
            </p>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="mt-[16px] rounded-full bg-brand-soft px-[16px] py-[8px] font-sans font-bold text-brand transition-colors hover:bg-brand hover:text-white"
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