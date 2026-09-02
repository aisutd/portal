import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEventReminderEmail } from "@/lib/emails/event-reminder";
import { getAuthenticatedUser } from "@/lib/auth";// Or your auth provider
import { auth } from "@clerk/nextjs";

const COOLDOWN_MINUTES = 60; // Cooldown window

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // 1. Authenticate sender
    const user = await getAuthenticatedUser();
    
    if (!user || (user.role !== "EXECUTIVE" && user.role !== "DIRECTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const senderUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!senderUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch Event with previous reminder details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, lastReminderSentAt: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 3. Cooldown Verification
    if (event.lastReminderSentAt) {
      const minutesPassed =
        (Date.now() - new Date(event.lastReminderSentAt).getTime()) / (1000 * 60);

      if (minutesPassed < COOLDOWN_MINUTES) {
        const remaining = Math.ceil(COOLDOWN_MINUTES - minutesPassed);
        return NextResponse.json(
          { error: `Reminders were sent recently. Retry in ${remaining} minute(s).` },
          { status: 429 }
        );
      }
    }

    // 4. Retrieve RSVPs
    const rsvps = await prisma.rSVP.findMany({
      where: { eventId, status: "GOING" },
      select: { userId: true },
    });

    if (rsvps.length === 0) {
      return NextResponse.json({ count: 0, message: "No RSVPs found" });
    }

    // 5. Dispatch Reminder Emails
    await Promise.all(
      rsvps.map((rsvp) =>
        sendEventReminderEmail({
          userId: rsvp.userId,
          eventId,
        })
      )
    );

    // 6. Record Audit Info
    const sentAt = new Date();
    await prisma.event.update({
      where: { id: eventId },
      data: {
        lastReminderSentAt: sentAt,
        lastReminderSentById: senderUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      count: rsvps.length,
      sentAt,
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}