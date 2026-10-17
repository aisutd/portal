import type { MembershipType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function listAimEvents(userId: string, audience: readonly MembershipType[]) {
  // No audience means no AIM access; hasSome against an empty list would match nothing anyway.
  if (audience.length === 0) return [];

  return await prisma.event.findMany({
    where: {
      isPublished: true,
      // Constraint: Must be scoped to an AIM audience this viewer belongs to
      visibilityMembership: {
        hasSome: [...audience],
      },
    },
    include: {
      attendances: {
        where: { userId },
      },
      rsvps: {
        where: { userId },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });
}

export async function getNextAimNight(userId: string, audience: readonly MembershipType[]) {
  if (audience.length === 0) return null;

  return await prisma.event.findFirst({
    where: {
      isPublished: true,
      startTime: {
        gte: new Date(),
      },
      visibilityMembership: {
        hasSome: [...audience],
      },
    },
    include: {
      attendances: {
        where: { userId },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });
}
