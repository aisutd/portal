export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Tag } from "@/components/ui/tag";
import { normalizeEventTags } from "@/lib/event-tags";
import { MobileEventDetail } from "@/components/mobile/events/MobileEventDetail";
import { EventDetailActions, EventQRCode } from "@/components/events/event-detail-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true, description: true },
  });

  if (!event) {
    return {
      title: "Event Not Found",
      description: "The requested event could not be found.",
    };
  }

  return {
    title: `Events — ${event.title}`,
    description: event.description,
  };
}

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const userId = user?.id ?? null;

  // Fix 1: Safely fetch event and conditionally query the user's RSVP + attendance relation
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      rsvps: userId 
        ? { 
            where: { userId },
            include: { attendance: true } // Pull in the attendance relation
          } 
        : false,
    },
  });

  if (!event || !event.isPublished) {
    notFound();
  }

  const now = new Date();
  const isPast = event.startTime < now;
  const userRsvp = userId && Array.isArray(event.rsvps) ? event.rsvps[0] : null;
  const isRsvpd = !!userRsvp && userRsvp.status === "GOING";
  
  const attended = !!userRsvp?.attendance;

  const normalizedTags = normalizeEventTags(event.tags);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.startTime));

  return (
    <>
      <div className="md:hidden">
        <MobileEventDetail eventId={event.id} />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar active="Events" />

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[28px] px-[46px] pb-[46px] pt-[45px]">
            {/* Back link */}
            <Link
              href="/events"
              className="font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-brand"
            >
              ← All Events
            </Link>

            <div className="flex flex-col gap-[32px] lg:flex-row lg:items-stretch">
              {/* Event body */}
              <div className="flex min-w-px flex-1 flex-col">
                <div className="flex h-[300px] w-full items-center justify-center rounded-[12px] bg-photo overflow-hidden">
                  <span className="font-mono text-[11px] tracking-[1.5px] text-photo-text">
                    PHOTO
                  </span>
                </div>
                
                <h1 className="mt-[20px] font-display text-[38px] font-bold leading-[41px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                  {event.title}
                </h1>

                {/* Date, Time, Location moved up right under title with a slightly bigger, cleaner aesthetic */}
                <p className="mt-[10px] font-mono text-[14px] font-medium leading-[20px] tracking-[0.2px] text-ink-muted">
                  {formattedDate} · {event.location}
                </p>

                <p className="mt-[20px] max-w-[640px] font-body text-[16px] font-normal leading-[24px] text-ink">
                  {event.description}
                </p>

                <div className="mt-[20px] flex flex-wrap gap-[10px]">
                  {normalizedTags.map((t) => (
                    <Tag key={t.label} label={t.label} bg={t.bg} color={t.color} />
                  ))}
                </div>
              </div>

              {/* Status & Action Card Sidebar */}
              <div
                  className={`flex w-full flex-col items-center justify-center gap-[16px] self-stretch rounded-[16px] p-[33px] lg:w-[360px] lg:shrink-0 ${
                    isPast
                      ? attended
                        ? "bg-[#d2ecd9]" // Soft green for attended
                        : isRsvpd
                        ? "bg-[#fdf2f2] border border-red-200" // Soft red/pink for RSVP'd but missed
                        : "bg-[#f4f1ea] border border-border-soft" // Neutral for never RSVP'd
                      : isRsvpd
                      ? "bg-[#d2ecd9]"
                      : "bg-white border border-border-soft shadow-sm"
                  }`}
                >
                  {isPast ? (
                    <>
                      <h2
                        className={`font-display text-[22px] font-semibold leading-[25.96px] [font-variation-settings:'wdth'_100] ${
                          attended ? "text-[#2c5d3e]" : isRsvpd ? "text-red-700" : "text-ink"
                        }`}
                      >
                        {attended ? "Attended" : isRsvpd ? "Missed Event" : "Event Passed"}
                      </h2>

                      <p className="text-center font-body text-[14px] text-ink-muted">
                        {attended
                          ? "Thanks for joining us at this event!"
                          : isRsvpd
                          ? "You RSVP'd for this event, but you didn't check in at the door."
                          : "You did not RSVP to or attend this event."}
                      </p>

                      {/* Visual Badge Breakdown */}
                      <div className="mt-2 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-white/60 border border-border-soft">
                        <span className="font-mono text-ink-faint">RSVP Status:</span>
                        <span className={isRsvpd ? "text-emerald-700 font-semibold" : "text-ink-muted"}>
                          {isRsvpd ? "Yes (Going)" : "No RSVP"}
                        </span>
                      </div>
                    </>
                  ) : isRsvpd ? (
                  <>
                    <h2 className="font-display text-[22px] font-semibold leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]">
                      You're Going!
                    </h2>

                    {/* Real scannable QR code component (Only shows when RSVP'd) */}
                    <EventQRCode value={userRsvp?.qrToken ?? `checkin-${userId}-${event.id}`} />

                    <p className="text-center font-mono text-[11px] text-ink-faint">
                      Scan QR at the door to check in
                    </p>

                    {/* Interactive RSVP Actions Wrapper */}
                    <EventDetailActions eventId={event.id} initialRsvpd={isRsvpd} />
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-[22px] font-semibold leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]">
                      Join This Event
                    </h2>
                    
                    <p className="text-center font-body text-[14px] text-ink-muted">
                      RSVP to secure your spot and unlock your check-in QR code.
                    </p>

                    {/* Interactive RSVP Actions Wrapper */}
                    <EventDetailActions eventId={event.id} initialRsvpd={isRsvpd} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}