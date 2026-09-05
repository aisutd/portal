import { NextResponse } from "next/server";
import { getCachedApiEvents } from "@/lib/events";

export const revalidate = 300;

export async function GET() {
  const events = await getCachedApiEvents();

  return NextResponse.json(events, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
