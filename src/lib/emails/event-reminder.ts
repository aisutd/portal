import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { generateCalendarLinks } from "@/lib/calendar";

const resend = new Resend(process.env.RESEND_API_KEY);

interface BatchSendArgs {
  rsvps: { userId: string }[];
  eventId: string;
}

function getRelativeTimeString(eventStartTime: Date) {
  const now = new Date();
  const eventDate = new Date(eventStartTime);
  const diffMs = eventDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { relativeText: "starting right now", headlineText: "Event Started!" };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) {
    const hoursText = diffHours <= 1 ? "1 hour" : `${diffHours} hours`;
    return {
      relativeText: `today in ${hoursText}`,
      headlineText: `Starting today in ${hoursText}!`,
    };
  }

  const daysText = diffDays === 1 ? "1 day" : `${diffDays} days`;
  return {
    relativeText: `in ${daysText}`,
    headlineText: `Happening in ${daysText}!`,
  };
}

export async function sendEventReminderEmailsBatch({ rsvps, eventId }: BatchSendArgs) {
  // 1. Fetch Event details once
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      title: true,
      description: true,
      location: true,
      startTime: true,
      endTime: true,
    },
  });

  if (!event) throw new Error("Event not found");

  // 2. Fetch all RSVP users in ONE database query instead of 315 individual queries
  const userIds = rsvps.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      email: true,
      profile: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  const relativeTime = getRelativeTimeString(event.startTime);
  const start = new Date(event.startTime).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "full",
    timeStyle: "short",
  });

  // 3. Construct Resend payload array
  const emailBatch = users.map((user) => {
    const userName =
      user.profile?.firstName && user.profile?.lastName
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user.profile?.firstName || "there";

    const { googleUrl, icsContent } = generateCalendarLinks({
      id: eventId,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      userId: user.id,
    });

    return {
      from: `"Artificial Intelligence Society" <${process.env.RESEND_DISPLAY_FROM_EMAIL}>`,
      to: user.email,
      replyTo: process.env.RESEND_REPLY_TO_EMAIL,
      subject: `Reminder: ${event.title} is ${relativeTime.relativeText}!`,
      html: `
        <div style="background-color: #faf7ee; padding: 32px 16px; font-family: Inter, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #c0bfbc; border-radius: 8px; padding: 32px; color: #16161c; line-height: 1.5;"> 
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://portal.aisutd.org/ais_logo_black.png" alt="AIS Logo" style="height: 32px; width: auto; display: inline-block;" />
            </div>

            <h2 style="color: #16161c; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; margin-top: 0; margin-bottom: 16px;">
              ${relativeTime.headlineText}
            </h2> 
            
            <p style="font-size: 14px; color: #16161c; margin-bottom: 12px;">Hi <strong>${userName}</strong>,</p> 
            <p style="font-size: 14px; color: #16161c; margin-bottom: 20px;">
              This is a quick reminder that <strong>${event.title}</strong> is taking place <strong>${relativeTime.relativeText}</strong>.
            </p> 
            
            <div style="background-color: #f4f1e7; border: 1px solid #e7e2d4; padding: 16px; border-radius: 6px; margin: 24px 0;"> 
              <p style="margin: 4px 0; font-size: 14px; color: #16161c;"><strong>Event:</strong> ${event.title}</p> 
              <p style="margin: 4px 0; font-size: 14px; color: #16161c;"><strong>Date & Time:</strong> ${start} CT</p> 
              <p style="margin: 4px 0; font-size: 14px; color: #16161c;"><strong>Location:</strong> ${event.location}</p> 
            </div> 

            <div style="text-align: center; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #55555f;">Add to your calendar:</p>
              <a href="${googleUrl}" target="_blank" style="background-color: #faf7ee; color: #16161c; border: 1px solid #c0bfbc; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 700; display: inline-block; margin: 4px;">Google Calendar</a>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="https://portal.aisutd.org/events/${eventId}" style="background-color: #2f5fe8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 15px; display: inline-block;">View Ticket & QR Code</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e7e2d4; margin: 28px 0;" />

            <h3 style="color: #16161c; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Important Information</h3> 
            <p style="font-size: 14px; color: #55555f; margin-bottom: 12px;">You may arrive up to 20 minutes before the event. On the big screen, there will be a QR code to scan for check-in. <strong>Please ensure you are logged into the AIS Portal on your mobile browser beforehand.</strong></p>
            <p style="font-size: 14px; color: #55555f; margin-bottom: 12px;">Your personal QR code acts as your ticket to claim any items we give out during the event (food, drinks, merch).</p>
            
            <p style="font-size: 14px; color: #16161c; margin-bottom: 16px;">We look forward to seeing you soon.</p> 
            <p style="font-size: 14px; color: #16161c; margin-top: 0; margin-bottom: 16px;">Best,<br/><strong>Artificial Intelligence Society</strong></p> 
          </div>
        </div>
      `,
      attachments: [
        {
          filename: "invite.ics",
          content: Buffer.from(icsContent).toString("base64"),
        },
      ],
    };
  });

  // 4. Send via Resend Batch API (max 100 emails per API request)
  const BATCH_LIMIT = 100;
  let totalSent = 0;

  for (let i = 0; i < emailBatch.length; i += BATCH_LIMIT) {
    const chunk = emailBatch.slice(i, i + BATCH_LIMIT);
    const response = await resend.batch.send(chunk);

    if (response.error) {
      console.error("Resend Batch Error:", response.error);
    } else {
      totalSent += chunk.length;
    }
  }

  return totalSent;
}