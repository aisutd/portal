export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import type { MembershipType, TEAM, UserRole } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventsBrowseClient } from "@/components/events/events-browse-client";
import { canViewEvent, isAimEvent } from "@/lib/event-visibility";

export const metadata: Metadata = {
  title: "Events — Browse",
  description: "Browse upcoming and past AIS events by tag.",
};

type EventViewer = {
  role: UserRole;
  team: TEAM | null;
  memberships: readonly MembershipType[];
};

async function getEventsData(userId: string | null, viewer: EventViewer | null) {
  const now = new Date();

  // Fetch active/upcoming events (where event has NOT ended yet)
  const upcomingRaw = await prisma.event.findMany({
    where: {
      isPublished: true,
      endTime: { gte: now }
    },
    orderBy: { startTime: "asc" },
    take: 20,
    include: {
      rsvps: userId
        ? {
            where: { userId: userId, status: "GOING" },
            include: { attendance: true }
          }
        : false,
    },
  }).then((events) => events.filter((e) => canViewEvent(e, viewer)));

  // Fetch past events (where event has completely ended)
  const pastRaw = await prisma.event.findMany({
    where: {
      isPublished: true,
      endTime: { lt: now }
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
  }).then((events) => events.filter((e) => canViewEvent(e, viewer)));

  const mapEvents = (events: typeof upcomingRaw) =>
    events.map((event) => {
      const userRsvp = event.rsvps && event.rsvps.length > 0 ? event.rsvps[0] : null;
      const isRsvpd = !!userRsvp;
      const hasAttended = userRsvp && 'attendance' in userRsvp ? !!userRsvp.attendance : false;
      const isLive = now >= event.startTime && now <= event.endTime;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        imageUrl: event.imageUrl ?? null,
        tags: isAimEvent(event) ? ["AIM", ...(event.tags || [])] : event.tags || [],
        isRsvpd,
        hasAttended,
        isLive,
        isRsvpOpen: event.isRsvpOpen ?? true,
      };
    });
  
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
        endTime: event.endTime.toISOString(),
        imageUrl: event.imageUrl ?? null,
        tags: isAimEvent(event) ? ["AIM", ...(event.tags || [])] : event.tags || [],
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
  const viewer: EventViewer | null = session
    ? {
        role: session.role,
        team: session.team,
        memberships: session.memberships
          .filter((m) => m.activeFlag)
          .map((m) => m.membershipType),
      }
    : null;
  const { upcomingEvents, pastEvents } = await getEventsData(userId, viewer);

  return <EventsBrowseClient upcomingEvents={upcomingEvents} pastEvents={pastEvents} />;
}