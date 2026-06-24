import { ALL_TAGS } from "../_data/events";
import { EVENTS } from "../_data/events";
import EventCard from "../_components/EventCard";
import Tag from "../_components/Tag";

export default function BrowseEventsPage() {
  return (
    <main className="flex flex-col lg:flex-row">
      {/* Tag sidebar */}
      <aside className="flex shrink-0 flex-col gap-[10px] border-b border-line px-6 py-8 sm:px-[26px] lg:w-[220px] lg:border-b-0 lg:border-r">
        <p className="font-nav text-[12px] uppercase tracking-[3px] text-muted">
          Tags
        </p>
        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
          {ALL_TAGS.map((t) => (
            <Tag key={t} name={t} />
          ))}
        </div>
      </aside>

      {/* Event grid */}
      <section className="flex-1 p-6 sm:p-[46px]">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {EVENTS.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </main>
  );
}
