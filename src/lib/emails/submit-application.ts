import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import path from "path";

interface SendApplicationConfirmationArgs {
  userId: string;
  applicationId: string;
}

export async function sendApplicationConfirmationEmail({
  userId,
  applicationId,
}: SendApplicationConfirmationArgs) {
  if (!userId || !applicationId) {
    throw new Error("Missing userId or applicationId");
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

  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    select: {
      title: true,
    },
  });

  if (!user || !application) {
    throw new Error("User or application not found");
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
      : "there";

  const mailOptions = {
    from: `"Artificial Intelligence Society" <${process.env.DISPLAY_FROM_EMAIL}>`,
    to: user.email,
    replyTo: `<${process.env.REPLY_EMAIL}>`,
    subject: `Application Received: ${application.title}`,
    html: `
    <div style="background-color: #faf7ee; padding: 32px 16px; font-family: Inter, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #c0bfbc; border-radius: 8px; padding: 32px; color: #16161c; line-height: 1.5;"> 

        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:ais_logo" alt="AIS Logo" style="height: 32px; width: auto; display: inline-block;" />
        </div>

        <h2 style="color: #16161c; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; margin-top: 0; margin-bottom: 16px;">Application Submitted!</h2> 
        
        <p style="font-size: 14px; color: #16161c; margin-bottom: 12px;">Hi <strong>${userName}</strong>,</p> 
        <p style="font-size: 14px; color: #16161c; margin-bottom: 20px;">Thank you for applying to <strong>${application.title}</strong>. We have successfully received your submission.</p> 
        
        <div style="background-color: #f4f1e7; border: 1px solid #e7e2d4; padding: 16px; border-radius: 6px; margin: 24px 0;"> 
          <p style="margin: 4px 0; font-size: 14px; color: #16161c;"><strong>Program:</strong> ${application.title}</p> 
          <p style="margin: 4px 0; font-size: 14px; color: #16161c;"><strong>Status:</strong> Received</p> 
        </div> 

        <div style="text-align: center; margin: 24px 0;">
          <a href="https://portal.aisutd.org/dashboard" style="background-color: #2f5fe8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 15px; display: inline-block;">View Portal Dashboard</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e7e2d4; margin: 28px 0;" />

        <h3 style="color: #16161c; font-size: 18px; font-weight: 700; letter-spacing: -0.05em; margin-top: 0; margin-bottom: 12px;">What Happens Next?</h3> 
        
        <p style="font-size: 14px; color: #55555f; margin-bottom: 12px;">Our team will review your application after the submission deadline closes. You will receive an update regarding your application status via email and on your portal dashboard.</p>
        
        <p style="font-size: 14px; color: #55555f; margin-bottom: 24px;">If you have any urgent questions or need to make changes before decisions are finalized, please feel free to reach out to us via Discord or email.</p> 
        
        <p style="font-size: 14px; color: #16161c; margin-bottom: 16px;">Thank you for your interest in joining us!</p> 
        
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
    ],
  };

  return await transporter.sendMail(mailOptions);
}