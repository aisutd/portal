import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { isAllowedEmail } from '@/lib/email-domains';

export async function POST(req: Request) {
  console.log('--- WEBHOOK REQUEST RECEIVED ---');

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return new Response('Error occurred -- missing svix headers', { status: 400 });
  }

  const body = await req.text();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET; // Have the dev CLERK_WEBHOOK_SECRET (not prod) in your .env.local

  if (!webhookSecret) {
    console.error("CRITICAL ERROR: CLERK_WEBHOOK_SECRET is not loaded in process.env!");
    return new Response('Missing secret in environment variables', { status: 500 });
  }

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Svix verification failed with error:", err);
    return new Response('Error occurred during verification', { status: 400 });
  }

  console.log(`Webhook verified! Event type: ${evt.type}`);

  if (evt.type === 'user.created') {
    const { id, email_addresses } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;

    if (!primaryEmail) {
      console.error("User has no email address");
      return new Response('Error: User has no email address', { status: 400 });
    }

    // Portal accounts are UTD/AIS only. Ack with 200 so Clerk stops retrying —
    // the Clerk user still exists, it just never gets a row in our database, so
    // it can't complete onboarding or reach the dashboard.
    if (!isAllowedEmail(primaryEmail)) {
      console.warn(`Ignoring user.created for disallowed email domain: ${primaryEmail}`);
      return new Response('', { status: 200 });
    }

    try {
      console.log(`Attempting to create user ${id} in Prisma...`);
      await prisma.user.create({
        data: {
          id: id,            
          clerkId: id,       
          email: primaryEmail,
          role: UserRole.MEMBER, 
        },
      });
      console.log("Successfully created user in Prisma!");
    } catch (dbError) {
      console.error("Prisma failed to create user. Error details:", dbError);
      return new Response('Database error', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
}