import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { startTime: "asc" },
    take: 20,
  });

  return NextResponse.json(events, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
    }
  });
}
