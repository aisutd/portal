import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { generateCalendarLinks } from "@/lib/calendar";

interface SendRsvpEmailArgs {
  userId: string;
  eventId: string;
}

export async function sendRsvpConfirmationEmail({ userId, eventId }: SendRsvpEmailArgs) {
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

  const userName = user.profile?.firstName && user.profile?.lastName 
    ? `${user.profile.firstName} ${user.profile.lastName}` 
    : "there";

  const start = new Date(event.startTime).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "full",
    timeStyle: "short",
  });

  const { googleUrl, outlookUrl, icsContent } = generateCalendarLinks({
    id: eventId,
    title: event.title,
    description: event.description,
    location: event.location,
    startTime: event.startTime,
    endTime: event.endTime,
    userId: userId
  });

    const mailOptions = {
      from: `"Artificial Intelligence Society" <${process.env.DISPLAY_FROM_EMAIL}>`,
      to: user.email,
      replyTo: `<${process.env.REPLY_EMAIL}>`,
      subject: `RSVP Confirmed: ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151; line-height: 1.5;"> 
          <h2 style="color: #1f2937; margin-bottom: 16px;">You're all set!</h2> 
          
          <p>Hi <strong>${userName}</strong>,</p> 
          <p>Your RSVP for <strong>${event.title}</strong> has been confirmed.</p> 
          
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;"> 
            <p style="margin: 4px 0;"><strong>Event:</strong> ${event.title}</p> 
            <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${start} CT</p> 
            <p style="margin: 4px 0;"><strong>Location:</strong> ${event.location}</p> 
          </div> 
          
          <div style="text-align: center; margin: 16px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">Add to your calendar:</p>
            <a href="${googleUrl}" target="_blank" style="background-color: #ffffff; color: #1f2937; border: 1px solid #d1d5db; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; display: inline-block; margin: 0 4px;">📅 Google Calendar</a>
            <a href="${outlookUrl}" target="_blank" style="background-color: #ffffff; color: #1f2937; border: 1px solid #d1d5db; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; display: inline-block; margin: 0 4px;">📅 Outlook</a>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://portal.aisutd.org/events/${eventId}" style="background-color: #1f2937; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Ticket & Event Details</a>
          </div>
          <h3 style="color: #1f2937; margin-top: 24px; margin-bottom: 12px;">Important Information</h3> 
          
          <p style="margin-bottom: 12px;">You may arrive up to 20 minutes before the event. On the big screen, there will be a QR code to scan for check-in. <strong>Please ensure you are logged into the AIS Portal on your mobile browser beforehand for a seamless check-in.</strong></p>
          
          <p style="margin-bottom: 12px;">You will also receive a QR code that acts as your encrypted ticket to claim any items we give out during the event, such as food, drinks, merch, or something extra special! <strong>This QR code is required to claim any items.</strong> To find your personal QR code at any time, just head to your dashboard or click on this event from your events list page.</p>
          
          <p style="margin-bottom: 12px;">Items are first-come, first-served, but we try our best to cover enough for the RSVP count 24 hours before the event.</p>
          
          <p style="margin-bottom: 24px;">If you arrive late, you may ask an officer to check you in through your personal QR ticket.</p> 
          
          <p style="margin-bottom: 12px;">We look forward to seeing you there.</p> 
          
          <p style="margin-top: 0;">Best,<br/><strong>Artificial Intelligence Society</strong></p> 
          <img href="${"/ais_logo_black.png"}" size-sm/>
        </div>
      `,
      attachments: [
      {
        filename: "invite.ics",
        content: icsContent,
        contentType: "text/calendar",
      },
    ],
    };

  return await transporter.sendMail(mailOptions);
}
