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

  // Filter both lists independently to keep them in distinct sections
  const filteredUpcoming = filterList(upcomingEvents);
  const filteredPast = filterList(pastEvents);
  const totalFilteredCount = filteredUpcoming.length + filteredPast.length;

  return (
    <>
      <div className="md:hidden">
        <MobileEventsBrowse upcomingEvents={filteredUpcoming} pastEvents={filteredPast} />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar active="Events" />
          <div className="flex w-full flex-col md:flex-row md:items-stretch">
            
            {/* Tag filter sidebar (Interactive) */}
            <aside className="flex flex-col gap-[10px] border-b border-border-soft px-[26px] py-[32px] md:w-[219px] md:shrink-0 md:border-b-0 md:border-r">
              <p className="font-techno text-[12px] uppercase leading-[normal] tracking-[3px] text-ink-faint">
                Tags
              </p>
              
              <div className="flex flex-wrap gap-[10px] md:flex-col md:items-start">
                <button
                  type="button"
                  aria-pressed={selectedTags.length === 0}
                  onClick={() => setSelectedTags([])}
                  className={`rounded-full px-[14px] py-[6px] font-mobile-body text-[13px] font-bold transition-all duration-200 ${
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
                      className="transition-transform active:scale-95 text-left"
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
            </aside>

            {/* Event sections (Distinct Sections with Flags) */}
            <div className="min-w-px flex-1 p-[46px] flex flex-col gap-[40px]">
              {totalFilteredCount === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border-soft bg-white p-[40px] text-center shadow-sm">
                  <p className="font-mobile-display text-[16px] font-bold text-ink">
                    No events found.
                  </p>
                  <p className="mt-[6px] font-mobile-body text-[14px] text-ink-muted">
                    We didn't have any events with selected filters. Look out in the near future!
                  </p>
                  {selectedTags.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTags([])}
                      className="mt-[16px] rounded-full bg-brand-soft px-[16px] py-[8px] font-mobile-body text-[13px] font-bold text-brand transition-colors hover:bg-brand hover:text-white"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Upcoming Events Section */}
                  <section className="flex flex-col gap-[20px]">
                    <h2 className="font-grotesk text-[22px] font-bold text-ink">
                      Upcoming Events
                    </h2>
                    {filteredUpcoming.length === 0 ? (
                      <p className="text-sm text-ink-muted">No upcoming events scheduled for these tags.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-2">
                        {filteredUpcoming.map((event) => (
                          <EventGridCard
                            key={event.id}
                            title={event.title}
                            meta={`${event.location} · ${formatEventDate(event.startTime, true)}`}
                            description={event.description}
                            tags={event.tags}
                            eventId={event.id}
                            isRsvpd={event.isRsvpd}
                            isPast={false}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Past Events Section */}
                  {filteredPast.length > 0 && (
                    <section className="flex flex-col gap-[20px]">
                      <h2 className="font-grotesk text-[22px] font-bold text-ink-muted">
                        Past Events
                      </h2>
                      <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-2 opacity-80">
                        {filteredPast.map((event) => (
                          <EventGridCard
                            key={event.id}
                            title={event.title}
                            meta={`${event.location} · ${formatEventDate(event.startTime, true)}`}
                            description={event.description}
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