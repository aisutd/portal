export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventsBrowseClient } from "@/components/events/events-browse-client";

export const metadata: Metadata = {
  title: "Events — Browse",
  description: "Browse upcoming and past AIS events by tag.",
};

async function getEventsData(userId: string | null) {
  const now = new Date();

  // Fetch upcoming events (ascending order: soonest first)
  const upcomingRaw = await prisma.event.findMany({
    where: { 
      isPublished: true,
      startTime: { gte: now } 
    },
    orderBy: { startTime: "asc" },
    take: 20,
    include: {
      rsvps: userId
        ? { where: { userId: userId, status: "GOING" } }
        : false,
    },
  });

  // Fetch past events (descending order: most recent past first)
  const pastRaw = await prisma.event.findMany({
    where: { 
      isPublished: true, 
      startTime: { lt: now } 
    },
    orderBy: { startTime: "desc" },
    take: 10,
    include: {
      rsvps: userId
        ? { 
            where: { userId: userId, status: "GOING" },
            include: { attendance: true },
          }
        : false,
    },
  });

  const mapEvents = (events: typeof upcomingRaw) =>
    events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime.toISOString(),
      tags: event.tags || [],
      isRsvpd: !!(event.rsvps && event.rsvps.length > 0),
    }));
  
  const mapPastEvents = (events: typeof pastRaw) =>
    events.map((event) => {
      const userRsvp = event.rsvps && event.rsvps.length > 0 ? event.rsvps[0] : null;
      const isRsvpd = !!userRsvp;
      const hasAttended = userRsvp && 'attendance' in userRsvp ? !!userRsvp.attendance : false;
      const missedEvent = isRsvpd && !hasAttended;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.startTime.toISOString(),
        tags: event.tags || [],
        isRsvpd,
        hasAttended,
        missedEvent,
      };
    });

  return {
    upcomingEvents: mapEvents(upcomingRaw),
    pastEvents: mapPastEvents(pastRaw),
  };
}

export default async function EventsBrowsePage() {
  const user = await getAuthenticatedUser();
  const userId = user?.id ?? null;
  const { upcomingEvents, pastEvents } = await getEventsData(userId);

  return <EventsBrowseClient upcomingEvents={upcomingEvents} pastEvents={pastEvents} />;
}