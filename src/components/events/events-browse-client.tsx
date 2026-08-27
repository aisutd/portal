"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Tag } from "@/components/ui/tag";
import { EventGridCard } from "@/components/events/event-grid-card";
import { MobileEventsBrowse } from "@/components/mobile/events/MobileEventsBrowse";
import { eventFilterTags } from "@/lib/data";
import { formatEventDate } from "@/lib/utils";

type EventRecord = {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  imageUrl?: string | null;
  tags: string[];
  isRsvpd?: boolean;
  hasAttended?: boolean;
  missedEvent?: boolean;
};

interface EventsBrowseClientProps {
  upcomingEvents: EventRecord[];
  pastEvents: EventRecord[];
}

export function EventsBrowseClient({ upcomingEvents, pastEvents }: EventsBrowseClientProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const filteredUpcoming = filterList(upcomingEvents);
  const filteredPast = filterList(pastEvents);
  const totalFilteredCount = filteredUpcoming.length + filteredPast.length;

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden">
        <MobileEventsBrowse upcomingEvents={filteredUpcoming} pastEvents={filteredPast} />
      </div>

      {/* Desktop & Tablet Layout */}
      <div className="hidden md:block">
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-cream">
          <div aria-hidden className="pointer-events-none absolute -top-20 right-[15%] -z-10 h-[400px] w-[400px] rounded-full bg-purple-400/20 blur-[110px]" />
          <div aria-hidden className="pointer-events-none absolute top-[40%] left-[-5%] -z-10 h-[340px] w-[340px] rounded-full bg-orange-300/20 blur-[110px]" />
          <Navbar active="Events" />
          <div className="flex w-full flex-col md:flex-row md:items-stretch">
            
            {/* Tag filter sidebar */}
            <aside className="flex flex-col gap-[10px] border-b border-border-soft px-6 py-8 md:w-[220px] md:shrink-0 md:border-b-0 md:border-r">
              <p className="font-techno uppercase leading-normal tracking-[3px] text-ink-faint">
                Tags
              </p>
              
              <div className="flex flex-wrap gap-[10px] md:flex-col md:items-start">
                <button
                  type="button"
                  aria-pressed={selectedTags.length === 0}
                  onClick={() => setSelectedTags([])}
                  className={`rounded-full px-[14px] py-[6px] style-mobile-body font-bold transition-all duration-200 ${
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
                      className="text-left transition-transform active:scale-95"
                    >
                      <Tag
                        label={t.label}
                        bg={t.bg}
                        color={t.color}
                        className={
                          isSelected
                            ? "ring-2 ring-brand/30 ring-offset-2 ring-offset-cream"
                            : "opacity-75 transition-opacity hover:opacity-100"
                        }
                      />
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="min-w-0 flex-1 flex-col gap-10 p-6 lg:p-11 flex">
              <div>
                <h1 className="style-page-title mb-3 text-brand">
                  Pick Your Next Sidequest
                </h1>
                <p className="style-page-subtitle text-ink-muted">
                  Join us to learn, build, and connect with the AIS community
                </p>
              </div>
              
              {totalFilteredCount === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border-soft bg-white p-10 text-center shadow-sm">
                  <p className="style-mobile-title text-ink">
                    No events found.
                  </p>
                  <p className="mt-1.5 style-mobile-body text-ink-muted">
                    We didn&apos;t find any events with the selected filters.
                  </p>
                  {selectedTags.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTags([])}
                      className="mt-4 rounded-full bg-brand-soft px-4 py-2 style-mobile-body font-bold text-brand transition-colors hover:bg-brand hover:text-white"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Upcoming Events */}
                  <section className="flex flex-col gap-5">
                    <h2 className="font-grotesk style-section-header font-bold text-ink">
                      Upcoming Events
                    </h2>
                    {filteredUpcoming.length === 0 ? (
                      <p className="text-sm text-ink-muted">
                        No upcoming events scheduled for these tags.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        {filteredUpcoming.map((event) => (
                          <EventGridCard
                            key={event.id}
                            title={event.title}
                            meta={`${event.location} · ${formatEventDate(event.startTime, true)}`}
                            description={event.description}
                            imageUrl={event.imageUrl}
                            tags={event.tags}
                            eventId={event.id}
                            isRsvpd={event.isRsvpd}
                            isPast={false}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Past Events */}
                  {filteredPast.length > 0 && (
                    <section className="flex flex-col gap-5">
                      <h2 className="font-grotesk style-section-header font-bold text-ink-muted">
                        Past Events
                      </h2>
                      <div className="grid grid-cols-1 gap-6 opacity-80 xl:grid-cols-2">
                        {filteredPast.map((event) => (
                          <EventGridCard
                            key={event.id}
                            title={event.title}
                            meta={`${event.location} · ${formatEventDate(event.startTime, true)}`}
                            description={event.description}
                            imageUrl={event.imageUrl}
                            tags={event.tags}
                            eventId={event.id}
                            isRsvpd={event.isRsvpd}
                            isPast={true}
                            hasAttended={event.hasAttended}
                            missedEvent={event.missedEvent}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}