export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/components/ui/tag";
import { normalizeEventTags } from "@/lib/event-tags";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { EventDetailActions, EventQRCode } from "@/components/events/event-detail-actions";
import { EventCoverImage } from "@/components/events/event-cover-image";

interface MobileEventDetailProps {
  eventId: string;
}

export async function MobileEventDetail({ eventId }: MobileEventDetailProps) {
  const user = await getAuthenticatedUser();
  const userId = user?.id ?? null;

  // Branch the query conditionally to keep Prisma's input types strictly valid
  const event = userId
    ? await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          rsvps: {
            where: { userId },
            include: { attendance: true },
          },
        },
      })
    : await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          rsvps: {
            where: { userId: "" },
          },
        },
      });

  if (!event || !event.isPublished) {
    notFound();
  }

  const now = new Date();
  const isPast = new Date(event.endTime) < now;
  const isLive = new Date(event.startTime) <= now && !isPast;

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

  const cardStyle = isPast
    ? attended
      ? "bg-[#d2ecd9]"
      : isRsvpd
      ? "bg-[#fdf2f2] border border-red-200"
      : "bg-[#f4f1ea] border border-border-soft"
    : attended
    ? "bg-[#d2ecd9]"
    : isRsvpd
    ? "bg-[#d2ecd9]"
    : "bg-white border border-border-soft shadow-sm";

  return (
    <MobileScreen>
      <Link 
        href="/events" 
        className="inline-flex items-center py-1 style-caption font-bold text-brand transition-opacity hover:opacity-80"
      >
        ← All Events
      </Link>

      <EventCoverImage
        imageUrl={event.imageUrl}
        className="h-55 w-full shrink-0 shadow-sm"
        alt={`${event.title} cover`}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h1 className="style-mobile-title leading-tight text-ink">
              {event.title}
            </h1>
            {isLive && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                LIVE
              </span>
            )}
          </div>
          <p className="style-caption font-medium text-ink-muted">
            {formattedDate} · {event.location}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {normalizedTags.map((t) => (
            <Tag key={t.label} label={t.label} bg={t.bg} color={t.color} />
          ))}
        </div>

        <p className="style-mobile-body leading-relaxed text-ink-muted">
          {event.description}
        </p>
      </div>

      <div className={`mt-2 flex flex-col items-center justify-center gap-[16px] rounded-[20px] p-[24px] shadow-sm ${cardStyle}`}>
        {isPast ? (
          <>
            <h2 className={`style-mobile-title ${
              attended ? "text-emerald-900" : isRsvpd ? "text-red-700" : "text-ink"
            }`}>
              {attended ? "Attended" : isRsvpd ? "Missed Event" : "Event Passed"}
            </h2>

            <p className="text-center style-mobile-body text-ink-muted">
              {attended
                ? "Thanks for joining us at this event!"
                : isRsvpd
                ? "You RSVP'd for this event, but you didn't check in at the door."
                : "You did not RSVP to or attend this event."}
            </p>

            <div className="mt-1 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-white/60 border border-border-soft">
              <span className="style-caption text-ink-faint">RSVP Status:</span>
              <span className={isRsvpd ? "text-emerald-700 font-semibold" : "text-ink-muted"}>
                {isRsvpd ? "Yes (Going)" : "No RSVP"}
              </span>
            </div>
          </>
        ) : attended ? (
          <>
            <h2 className="style-mobile-title text-emerald-900">
              Checked In!
            </h2>

            <EventQRCode value={userRsvp?.qrToken ?? `checkin-${userId}-${event.id}`} />

            <p className="text-center style-caption text-emerald-800 font-medium">
              Your ticket can still be scanned for claiming items or swag.
            </p>

            <EventDetailActions eventId={event.id} initialRsvpd={isRsvpd} />
          </>
        ) : isRsvpd ? (
          <>
            <h2 className="style-mobile-title text-ink">
              {isLive ? "Happening Now!" : "You're Going!"}
            </h2>

            <EventQRCode value={userRsvp?.qrToken ?? `checkin-${userId}-${event.id}`} />

            <p className="text-center style-caption text-ink-faint">
              Scan QR at the door to check in
            </p>

            <EventDetailActions eventId={event.id} initialRsvpd={isRsvpd} />
          </>
        ) : (
          <>
            <h2 className="style-mobile-title leading-[25.96px] text-ink">
              {isLive ? "Event is Live!" : "Join This Event"}
            </h2>
            
            <p className="text-center style-mobile-body text-ink-muted">
              {isLive
                ? "RSVP now to secure your attendance and show your QR code at the door."
                : "RSVP to secure your spot and unlock your QR code for check-in and claiming merch."}
            </p>

            <EventDetailActions eventId={event.id} initialRsvpd={isRsvpd} />
          </>
        )}
      </div>

      <BottomNav />
    </MobileScreen>
  );
}