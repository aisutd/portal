import Link from "next/link";
import Tag from "./Tag";
import type { EventRecord } from "../_data/events";

export default function EventCard({ event }: { event: EventRecord }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-[0px_12px_30px_0px_rgba(0,0,0,0.08)]"
    >
      {/* Photo placeholder */}
      <div className="flex h-[150px] items-center justify-center rounded-xl bg-placeholder">
        <span className="font-ibm text-[11px] tracking-[1.5px] text-placeholder-text">
          PHOTO
        </span>
      </div>

      <h3 className="mt-4 font-heading text-[17px] font-semibold text-ink">
        {event.title}
      </h3>
      <p className="mt-2 font-ibm text-[12px] tracking-[0.2px] text-muted">
        {event.meta}
      </p>
      <p className="mt-2 font-body text-[14px] text-slate">{event.blurb}</p>

      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="flex flex-wrap gap-2">
          {event.tags.slice(0, 2).map((t) => (
            <Tag key={t} name={t} />
          ))}
        </div>
        <span className="inline-flex items-center justify-center rounded-lg bg-ais-blue px-[15px] py-[9px] font-body text-[13px] font-semibold text-white shadow-[0px_5px_7px_rgba(47,95,232,0.3)]">
          RSVP
        </span>
      </div>
    </Link>
  );
}
