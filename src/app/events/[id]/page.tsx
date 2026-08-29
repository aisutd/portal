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
import { EventCoverImage } from "@/components/events/event-cover-image";

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
  const session = await getAuthenticatedUser();
  // FIXED: Fetch target userId from profile.userId instead of base user.id
  const userId = session?.profile?.userId ?? null;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      rsvps: userId 
        ? { 
            where: { userId },
            include: { attendance: true }
          } 
        : false,
    },
  });

  if (!event || !event.isPublished) {
    notFound();
  }

  const now = new Date();
  
  const isPast = event.endTime < now;
  const isLive = now >= event.startTime && now <= event.endTime;

  const userRsvp = userId && Array.isArray(event.rsvps) ? event.rsvps[0] : null;
  const isRsvpd = !!userRsvp && userRsvp.status === "GOING";
  const attended = userRsvp && 'attendance' in userRsvp ? !!userRsvp.attendance : false;
  
  const normalizedTags = normalizeEventTags(event.tags);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
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
              className="style-caption leading-[16.8px] tracking-[0.2px] text-brand"
            >
              ← All Events
            </Link>

            <div className="flex flex-col gap-[32px] lg:flex-row lg:items-stretch">
              {/* Event body */}
              <div className="flex min-w-px flex-1 flex-col">
                <EventCoverImage
                  imageUrl={event.imageUrl}
                  className="h-[300px] w-full"
                  alt={`${event.title} cover`}
                />
                
                <div className="mt-[20px] flex items-center gap-3">
                  <h1 className="style-section-header leading-[41px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                    {event.title}
                  </h1>
                  {isLive && (
                    <span className="style-badge-text inline-flex items-center gap-1.5 rounded-full bg-checked px-3 py-1 uppercase tracking-wider text-checked-text">
                      <span className="h-2 w-2 rounded-full bg-green animate-pulse" />
                      Happening Now
                    </span>
                  )}
                </div>

                <p className="mt-[10px] style-caption font-medium leading-[20px] tracking-[0.2px] text-ink-muted">
                  {formattedDate} · {event.location}
                </p>

                <p className="mt-[20px] max-w-[640px] style-body-text leading-[24px] text-ink">
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
                      ? "bg-checked border-2 border-green"
                      : isRsvpd
                      ? "bg-danger-ink/20 border-2 border-danger-ink"
                      : "bg-[#f4f1ea] border border-border-soft"
                    : attended
                    ? "bg-checked"
                    : isRsvpd
                    ? "bg-checked"
                    : "bg-white border border-border-soft shadow-sm"
                }`}
              >
                {isPast ? (
                  <>
                    <h2
                      className={`style-section-header ${
                        attended ? "text-green" : isRsvpd ? "text-danger-ink" : "text-ink"
                      }`}
                    >
                      {attended ? "Attended" : isRsvpd ? "Missed Event" : "Event Concluded"}
                    </h2>

                    <p className="text-center style-body-text text-ink-muted">
                      {attended
                        ? "Thanks for joining us at this event!"
                        : isRsvpd
                        ? "You RSVP'd for this event, but you didn't check in at the door."
                        : "This event has ended and attendance tracking is closed."}
                    </p>

                    <div className="mt-2 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-white/60 border border-border-soft">
                      <span className="style-caption text-ink-faint">RSVP Status:</span>
                      <span className={isRsvpd ? "text-green font-semibold" : "text-ink-muted"}>
                        {isRsvpd ? "Yes (Going)" : "No RSVP"}
                      </span>
                    </div>
                  </>
                ) : attended ? (
                  <>
                    <h2 className="style-section-header leading-[25.96px] text-green [font-variation-settings:'wdth'_100]">
                      Checked In!
                    </h2>

                    <EventQRCode value={userRsvp?.qrToken ?? `checkin-${userId}-${event.id}`} />

                    <p className="text-center style-caption text-green font-medium">
                      Your ticket can still be scanned for claiming items or swag.
                    </p>
                  </>
                ) : isRsvpd ? (
                  <>
                    <h2 className="style-section-header text-green">
                      {isLive ? "Check-in started!" : "RSVP'd. You're Going!"}
                    </h2>

                    <EventQRCode value={userRsvp?.qrToken ?? `checkin-${userId}-${event.id}`} />

                    <p className="text-center style-caption text-ink-faint">
                      This is your ticket to claim food, merch, drinks, etc. If you are late and don&apos;t see the attendance on the big screen, show this QR to an officer to check you in.
                    </p>

                    <EventDetailActions eventId={event.id} initialRsvpd={isRsvpd} />
                  </>
                ) : (
                  <>
                    <h2 className="style-section-header leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]">
                      {isLive ? "Event is Live!" : "Join This Event"}
                    </h2>
                    
                    <p className="text-center style-body-text text-ink-muted">
                      {isLive
                        ? "RSVP now to secure your attendance and to show your QR code for claiming food/drinks/merch."
                        : "RSVP to secure your spot and unlock your QR code to claim food/drinks/merch at the event."}
                    </p>

                    <EventDetailActions eventId={event.id} initialRsvpd={isRsvpd} />

                    {!userId && (
                      <div className="mt-4 flex w-full flex-col gap-1 rounded-2xl border-orange border-2 bg-orange-soft p-4 text-center">
                        <p className="style-badge-text text-md text-brand">
                          Clicking RSVP will redirect you to Sign In or Sign Up.
                        </p>
                        <p className="style-meta-text text-ink">
                          Creating an account takes under 20 seconds and saves your info for fast applications to our programs and 1-click event RSVPs in the future!
                        </p>
                      </div>
                    )}
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