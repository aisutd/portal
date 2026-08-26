import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateQRToken } from "@/lib/qrToken";
import { sendRsvpConfirmationEmail } from "@/lib/emails/confirm-rsvp-email";
import { sendRsvpCancellationEmail } from "@/lib/emails/cancel-rsvp-email";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("attempting to confirm rsvp");
  const { id: eventId } = await params;

  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId }
  });

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

  // Use upsert to handle both first-time RSVPs and re-RSVPs
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

  console.log("RSVP is confirmed. now should try sending email.");

  try {
    await sendRsvpConfirmationEmail({ 
      userId: user.id, 
      eventId: eventId 
    });
    console.log("RSVP confirmation email dispatched successfully.");
  } catch (error: any) {
    console.error("Failed to send RSVP email:", error.message);
  }

  // Always return the database record confirmation to your client frontend
  return NextResponse.json({ success: true, rsvp });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  console.log("attempting to delete rsvp");
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

  try {
    await sendRsvpCancellationEmail({ 
      userId: user.id, 
      eventId: eventId 
    });
    console.log("RSVP cancellation email dispatched successfully.");
  } catch (error: any) {

    console.error("Failed to send RSVP cancel email:", error.message);
  }

  return NextResponse.json({ success: true });
}
