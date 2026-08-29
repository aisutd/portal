import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import path from "path";

interface SendRsvpEmailArgs {
  userId: string;
  eventId: string;
}

export async function sendRsvpCancellationEmail({ userId, eventId }: SendRsvpEmailArgs) {
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

  const mailOptions = {
    from: `"Artificial Intelligence Society" <${process.env.DISPLAY_FROM_EMAIL}>`,
    to: user.email,
    replyTo: `<${process.env.REPLY_EMAIL}>`,
    subject: `RSVP Cancelled: ${event.title}`,
    html: `
      <div style="background-color: #faf7ee; padding: 32px 16px; font-family: Inter, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #c0bfbc; border-radius: 8px; padding: 32px; color: #16161c; line-height: 1.5;"> 
          <img src="cid:ais_logo" alt="AIS Logo" style="height: 28px; width: auto; display: block; margin-bottom: 24px;" />
          <h2 style="color: #16161c; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; margin-top: 0; margin-bottom: 16px;">RSVP Cancelled</h2> 
          
          <p style="font-size: 14px; color: #16161c; margin-bottom: 12px;">Hi <strong>${userName}</strong>,</p> 
          <p style="font-size: 14px; color: #16161c; margin-bottom: 20px;">Your RSVP for <strong>${event.title}</strong> has been cancelled.</p> 
          
          <div style="background-color: #f4f1e7; border: 1px solid #e7e2d4; padding: 16px; border-radius: 6px; margin: 24px 0;"> 
            <p style="margin: 4px 0; font-size: 14px; color: #16161c;"><strong>Event:</strong> ${event.title}</p> 
            <p style="margin: 4px 0; font-size: 14px; color: #16161c;"><strong>Date & Time:</strong> ${start} CT</p> 
            <p style="margin: 4px 0; font-size: 14px; color: #16161c;"><strong>Location:</strong> ${event.location}</p> 
          </div> 
          
          <div style="text-align: center; margin: 20px 0 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #55555f;">If you think this was a mistake, please visit the event page using the button below to re-RSVP.</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://portal.aisutd.org/events/${eventId}" style="background-color: #2f5fe8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 15px; display: inline-block;">View Event Details</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e7e2d4; margin: 28px 0;" />

          <h3 style="color: #16161c; font-size: 18px; font-weight: 700; letter-spacing: -0.05em; margin-top: 0; margin-bottom: 12px;">Important Information</h3> 
          
          <p style="font-size: 14px; color: #55555f; margin-bottom: 12px;">Not attending this event could have consequences for your future membership. If you are unsure, please ask your program's officers for more information.</p>
          <p style="font-size: 14px; color: #55555f; margin-bottom: 12px;">If you change your mind last minute, you may check-in without RSVPing at the event, but you will not be guaranteed any items that we give out.</p>
          <p style="font-size: 14px; color: #55555f; margin-bottom: 12px;">Whenever you feel you can attend this event, you can go back to the portal and re-RSVP to the event 24 hours before the event to ensure enough supply of items for you.</p>
          <p style="font-size: 14px; color: #55555f; margin-bottom: 24px;">Items are still first-come, first-served so arrive early if you do choose to come back.</p>
          <p style="font-size: 14px; color: #16161c; margin-bottom: 16px;">We're sorry to see you go.</p> 
          
          <p style="font-size: 14px; color: #16161c; margin-top: 0; margin-bottom: 16px;">Best,<br/><strong>Artificial Intelligence Society</strong></p> 
          

          <hr style="border: none; border-top: 1px solid #e7e2d4; margin: 28px 0 20px 0;" />

          <div style="text-align: center;">
            <p style="font-size: 12px; font-weight: 700; color: #8a8a93; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Connect with us</p>
            
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 8px;">
                  <a href="https://discord.gg/JFEkPHjzEK" target="_blank" style="color: #2f5fe8; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-block;">
                    Discord
                  </a>
                </td>
                <td style="color: #c0bfbc; font-size: 13px;">•</td>
                <td style="padding: 0 8px;">
                  <a href="https://instagram.com/utdais" target="_blank" style="color: #2f5fe8; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-block;">
                    Instagram
                  </a>
                </td>
                <td style="color: #c0bfbc; font-size: 13px;">•</td>
                <td style="padding: 0 8px;">
                  <a href="https://aisutd.org" target="_blank" style="color: #2f5fe8; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-block;">
                    Website
                  </a>
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
    ]
  };
  

  return await transporter.sendMail(mailOptions);
}