import Link from "next/link";
import { notFound } from "next/navigation";
import Tag from "../_components/Tag";
import { EVENTS, getEvent } from "../_data/events";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ id: e.id }));
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = getEvent(id);
  if (!event) notFound();

  return (
    <main className="mx-auto w-full max-w-[1428px] px-6 pb-16 pt-10 sm:px-[46px] sm:pt-[45px]">
      <Link
        href="/events/browse"
        className="font-ibm text-[12px] tracking-[0.2px] text-ais-blue hover:underline"
      >
        ← All Events
      </Link>

      <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-stretch">
        {/* Left column */}
        <div className="flex flex-1 flex-col">
          <div className="flex h-[220px] items-center justify-center rounded-xl bg-placeholder sm:h-[300px]">
            <span className="font-ibm text-[11px] tracking-[1.5px] text-placeholder-text">
              PHOTO
            </span>
          </div>

          <h1 className="mt-6 font-heading text-[32px] font-bold leading-[1.08] tracking-[-0.4px] text-ink sm:text-[38px] sm:leading-[41px]">
            {event.title}
          </h1>

          <p className="mt-4 max-w-[640px] font-body text-[16px] leading-[24px] text-ink">
            {event.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-[10px]">
            {event.tags.map((t) => (
              <Tag key={t} name={t} />
            ))}
          </div>

          <p className="mt-4 font-ibm text-[12px] tracking-[0.2px] text-muted">
            {event.detailMeta}
          </p>
        </div>

        {/* Right column — RSVP / check-in card */}
        {event.checkedIn ? (
          <aside className="flex w-full flex-col items-center gap-4 rounded-2xl bg-checked p-8 lg:w-[340px] lg:p-[33px]">
            <h2 className="font-heading text-[22px] font-semibold text-checked-text">
              Checked In!!
            </h2>

            {/* QR placeholder */}
            <div className="flex size-[200px] items-center justify-center rounded-[10px] border border-ink bg-white">
              <div className="size-[72px] border border-ink" />
            </div>

            <button className="w-full rounded-[10px] bg-ais-blue px-[21px] py-[13px] font-body text-[15px] font-semibold text-white shadow-[0px_5px_7px_rgba(47,95,232,0.3)] transition-transform hover:scale-[1.02]">
              Add to Calendar
            </button>
            <button className="w-full rounded-[10px] bg-orange px-[21px] py-[13px] font-body text-[15px] font-semibold text-orange-text shadow-[0px_5px_7px_rgba(242,169,104,0.34)] transition-transform hover:scale-[1.02]">
              Cancel RSVP
            </button>
          </aside>
        ) : (
          <aside className="flex w-full flex-col items-center gap-4 rounded-2xl border border-line bg-white p-8 lg:w-[340px] lg:p-[33px]">
            <h2 className="font-heading text-[22px] font-semibold text-ink">
              Save your spot
            </h2>
            <p className="text-center font-body text-[14px] leading-[20.3px] text-slate">
              RSVP to reserve a place. You&apos;ll get a check-in QR code the day
              of the event.
            </p>
            <button className="w-full rounded-[10px] bg-ais-blue px-[21px] py-[13px] font-body text-[15px] font-semibold text-white shadow-[0px_5px_7px_rgba(47,95,232,0.3)] transition-transform hover:scale-[1.02]">
              RSVP Now
            </button>
          </aside>
        )}
      </div>
    </main>
  );
}
