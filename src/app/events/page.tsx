import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCachedPublicEvents } from "@/lib/events";
import { EventsBrowseClient } from "@/components/events/events-browse-client";

export const metadata: Metadata = {
  title: "Events — Browse",
  description: "Browse upcoming and past AIS events by tag.",
};

async function getEventsData(userId: string | null) {
  const now = new Date();
  const publicEvents = await getCachedPublicEvents();
  const upcomingRaw = publicEvents
    .filter((event) => event.endTime >= now)
    .slice(0, 20);
  const pastRaw = publicEvents
    .filter((event) => event.endTime < now)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 10);
  const eventIds = [...upcomingRaw, ...pastRaw].map((event) => event.id);
  const rsvps = userId && eventIds.length > 0
    ? await prisma.rSVP.findMany({
        where: {
          userId,
          eventId: { in: eventIds },
          status: "GOING",
        },
        include: { attendance: true },
      })
    : [];
  const rsvpByEventId = new Map(rsvps.map((rsvp) => [rsvp.eventId, rsvp]));

  const mapEvents = (events: typeof upcomingRaw) =>
    events.map((event) => {
      const userRsvp = rsvpByEventId.get(event.id) ?? null;
      const isRsvpd = !!userRsvp;
      const hasAttended = !!userRsvp?.attendance;
      const isLive = now >= event.startTime && now <= event.endTime;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        imageUrl: event.imageUrl ?? null,
        tags: event.tags || [],
        isRsvpd,
        hasAttended,
        isLive,
        isRsvpOpen: event.isRsvpOpen ?? true,
      };
    });
  
  const mapPastEvents = (events: typeof pastRaw) =>
    events.map((event) => {
      const userRsvp = rsvpByEventId.get(event.id) ?? null;
      const isRsvpd = !!userRsvp;
      const hasAttended = !!userRsvp?.attendance;
      const missedEvent = isRsvpd && !hasAttended;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        imageUrl: event.imageUrl ?? null,
        tags: event.tags || [],
        isRsvpd,
        hasAttended,
        missedEvent,
        isLive: false,
        isRsvpOpen: event.isRsvpOpen ?? true,
      };
    });

  return {
    upcomingEvents: mapEvents(upcomingRaw),
    pastEvents: mapPastEvents(pastRaw),
  };
}

export default async function EventsBrowsePage() {
  const session = await getAuthenticatedUser();
  // FIXED: Access profile.userId to match CheckInPage & RSVP queries
  const userId = session?.profile?.userId ?? null;
  const { upcomingEvents, pastEvents } = await getEventsData(userId);

  return <EventsBrowseClient upcomingEvents={upcomingEvents} pastEvents={pastEvents} />;
}