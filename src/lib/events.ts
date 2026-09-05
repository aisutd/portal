import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const PUBLIC_EVENTS_CACHE_TAG = "events-public";
const PUBLIC_EVENTS_REVALIDATE_SECONDS = 300;

export const getCachedPublicEvents = unstable_cache(
  async () =>
    prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { startTime: "asc" },
    }),
  ["public-events-list"],
  {
    revalidate: PUBLIC_EVENTS_REVALIDATE_SECONDS,
    tags: [PUBLIC_EVENTS_CACHE_TAG],
  },
);

export function getCachedPublicEvent(id: string) {
  return unstable_cache(
    async () =>
      prisma.event.findUnique({
        where: { id },
      }),
    ["public-event", id],
    {
      revalidate: PUBLIC_EVENTS_REVALIDATE_SECONDS,
      tags: [PUBLIC_EVENTS_CACHE_TAG],
    },
  )();
}

export const getCachedApiEvents = unstable_cache(
  async () =>
    prisma.event.findMany({
      orderBy: { startTime: "asc" },
      take: 20,
    }),
  ["api-events-list"],
  {
    revalidate: PUBLIC_EVENTS_REVALIDATE_SECONDS,
    tags: [PUBLIC_EVENTS_CACHE_TAG],
  },
);
