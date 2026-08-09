import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateQRToken } from "@/lib/qrToken";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });

  if (!existingEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const existingRsvp = await prisma.rSVP.findUnique({
    where: {
      userId_eventId: {
        userId: user.id,
        eventId,
      },
    },
  });

  if (existingRsvp?.status === "GOING") {
    return NextResponse.json({ error: "Already RSVP'd" }, { status: 409 });
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const qrToken = await generateQRToken({
    userId: user.id,
    eventId,
    ttl: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    nonce: `${user.id}:${eventId}:${Date.now()}`,
  });

  const rsvpData = {
    status: "GOING" as const,
    qrToken,
    qrPayload: JSON.stringify({
      userId: user.id,
      eventId,
      token: qrToken,
      expiresAt: expiresAt.toISOString(),
    }),
    qrExpiresAt: expiresAt,
  };

  // FIX: Use upsert to handle both first-time RSVPs and re-RSVPs
  const rsvp = await prisma.rSVP.upsert({
    where: {
      userId_eventId: {
        userId: user.id,
        eventId,
      },
    },
    update: rsvpData,
    create: {
      userId: user.id,
      eventId,
      ...rsvpData,
    },
  });

  return NextResponse.json({ success: true, rsvp });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;

  const existing = await prisma.rSVP.findUnique({
    where: {
      userId_eventId: {
        userId: user.id,
        eventId,
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
  }

  await prisma.rSVP.update({
    where: { id: existing.id },
    data: { status: "CANCELED" },
  });

  return NextResponse.json({ success: true });
}
