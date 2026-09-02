import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { generateCalendarLinks } from "@/lib/calendar";
import path from "path";

interface SendEventReminderArgs {
  userId: string;
  eventId: string;
}

/**
 * Calculates human-readable time remaining (e.g., "in 3 days" or "today in 4 hours")
 */
function getRelativeTimeString(eventStartTime: Date): {
  relativeText: string;
  headlineText: string;
} {
  const now = new Date();
  const eventDate = new Date(eventStartTime);
  const diffMs = eventDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      relativeText: "starting right now",
      headlineText: "Event Started!",
    };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // Less than 24 hours away
  if (diffHours < 24) {
    const hoursText = diffHours <= 1 ? "1 hour" : `${diffHours} hours`;
    return {
      relativeText: `today in ${hoursText}`,
      headlineText: `Starting today in ${hoursText}!`,
    };
  }

  // 24 hours or more away
  const daysText = diffDays === 1 ? "1 day" : `${diffDays} days`;
  return {
    relativeText: `in ${daysText}`,
    headlineText: `Happening in ${daysText}!`,
  };
}

export async function sendEventReminderEmail({ userId, eventId }: SendEventReminderArgs) {
  if (!userId || !eventId) {
    throw new Error("Missing userId or eventId");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

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

  if (!user || !event) {
    throw new Error("User or event not found");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASSWORD,
    },
  });

  const userName =
    user.profile?.firstName && user.profile?.lastName
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.profile?.firstName
      ? user.profile.firstName
      : "there";

  const start = new Date(event.startTime).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "full",
    timeStyle: "short",
  });

  const relativeTime = getRelativeTimeString(event.startTime);

  const { googleUrl, icsContent } = generateCalendarLinks({
    id: eventId,
    title: event.title,
    description: event.description,
    location: event.location,
    startTime: event.startTime,
    endTime: event.endTime,
    userId: userId,
  });

  const mailOptions = {
    from: `"Artificial Intelligence Society" <${process.env.DISPLAY_FROM_EMAIL}>`,
    to: user.email,
    replyTo: `<${process.env.REPLY_EMAIL}>`,
    subject: `Reminder: ${event.title} is ${relativeTime.relativeText}!`,
    html: `
      <div style="background-color: #faf7ee; padding: 32px 16px; font-family: Inter, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #c0bfbc; border-radius: 8px; padding: 32px; color: #16161c; line-height: 1.5;"> 

          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:ais_logo" alt="AIS Logo" style="height: 32px; width: auto; display: inline-block;" />
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

          <h3 style="color: #16161c; font-size: 18px; font-weight: 700; letter-spacing: -0.05em; margin-top: 0; margin-bottom: 12px;">Important Information</h3> 
          
          <p style="font-size: 14px; color: #55555f; margin-bottom: 12px;">You may arrive up to 20 minutes before the event. On the big screen, there will be a QR code to scan for check-in. <strong>Please ensure you are logged into the AIS Portal on your mobile browser beforehand for a seamless check-in.</strong></p>
          
          <p style="font-size: 14px; color: #55555f; margin-bottom: 12px;">Your personal QR code acts as your ticket to claim any items we give out during the event (food, drinks, merch). <strong>This QR code is required to claim items.</strong> You can access it anytime on your dashboard or the event details page.</p>
          
          <p style="font-size: 14px; color: #16161c; margin-bottom: 16px;">We look forward to seeing you soon.</p> 
          
          <p style="font-size: 14px; color: #16161c; margin-top: 0; margin-bottom: 16px;">Best,<br/><strong>Artificial Intelligence Society</strong></p> 

          <hr style="border: none; border-top: 1px solid #e7e2d4; margin: 28px 0 20px 0;" />

          <div style="text-align: center;">
            <p style="font-size: 12px; font-weight: 700; color: #8a8a93; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Connect with us</p>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 8px;">
                  <a href="https://discord.gg/JFEkPHjzEK" target="_blank" style="color: #2f5fe8; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-block;">Discord</a>
                </td>
                <td style="color: #c0bfbc; font-size: 13px;">•</td>
                <td style="padding: 0 8px;">
                  <a href="https://instagram.com/utdais" target="_blank" style="color: #2f5fe8; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-block;">Instagram</a>
                </td>
                <td style="color: #c0bfbc; font-size: 13px;">•</td>
                <td style="padding: 0 8px;">
                  <a href="https://aisutd.org" target="_blank" style="color: #2f5fe8; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-block;">Website</a>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: "ais_logo_black.png",
        path: path.join(process.cwd(), "public", "ais_logo_black.png"),
        cid: "ais_logo",
      },
      {
        filename: "invite.ics",
        content: icsContent,
        contentType: "text/calendar",
      },
    ],
  };

  return await transporter.sendMail(mailOptions);
}