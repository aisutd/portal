import { prisma } from "@/lib/prisma";

export async function listAimEvents(userId: string) {
  return await prisma.event.findMany({
    where: {
      isPublished: true,
      // Constraint: Must be restricted to AIM_MENTOR or AIM_MENTEE
      visibilityMembership: {
        hasSome: ["AIM_MENTOR", "AIM_MENTEE"],
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

export async function getNextAimNight(userId: string) {
  return await prisma.event.findFirst({
    where: {
      isPublished: true,
      startTime: {
        gte: new Date(),
      },
      visibilityMembership: {
        hasSome: ["AIM_MENTOR", "AIM_MENTEE"],
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