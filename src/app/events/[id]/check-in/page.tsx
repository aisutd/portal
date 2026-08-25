import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQRToken } from "@/lib/qrToken";

interface CheckInProps {
  searchParams: Promise<{ token?: string; redirect?: string }>;
}

export default async function CheckInPage({ searchParams }: CheckInProps) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;
  const redirectTo = resolvedParams.redirect || "/events";
  const session = await getAuthenticatedUser();

  // 1. Missing Token State
  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream p-6 text-center">
        <div className="w-full max-w-[420px] rounded-[16px] bg-white p-[36px] border border-border-soft shadow-sm">
          <span className="style-caption font-semibold uppercase tracking-wider text-red-600">
            Error
          </span>
          <h1 className="mt-[12px] style-section-header text-ink">
            Invalid Check-In Link
          </h1>
          <p className="mt-[8px] style-body-text text-ink-muted leading-[20px]">
            The check-in link appears to be malformed or missing a security token.
          </p>
          <div className="mt-[24px]">
            <Link
              href="/events"
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-brand px-4 py-[12px] style-caption font-medium text-white transition-colors hover:bg-brand-dark"
            >
              ← Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Force sign-in/onboarding and preserve token context using Clerk's standard redirect_url pattern
  if (!session?.profile?.userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/events/check-in?token=${token}&redirect=${redirectTo}`)}`);
  }

  // 3. Find the event using the unique token
  const event = await prisma.event.findUnique({
    where: { checkInToken: token },
  });

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream p-6 text-center">
        <div className="w-full max-w-[420px] rounded-[16px] bg-white p-[36px] border border-border-soft shadow-sm">
          <span className="style-caption font-semibold uppercase tracking-wider text-ink-muted">
            Not Found
          </span>
          <h1 className="mt-[12px] style-section-header text-ink">
            Event Not Found
          </h1>
          <p className="mt-[8px] style-body-text text-ink-muted leading-[20px]">
            We couldn't locate an event matching this check-in token.
          </p>
          <div className="mt-[24px]">
            <Link
              href="/events"
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-brand px-4 py-[12px] style-caption font-medium text-white transition-colors hover:bg-brand-dark"
            >
              ← Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Check if the event has already ended
  const now = new Date();
  if (now > event.endTime) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream p-6 text-center">
        <div className="w-full max-w-[420px] rounded-[16px] bg-[#f4f1ea] p-[36px] border border-border-soft">
          <span className="style-caption font-semibold uppercase tracking-wider text-ink-faint">
            Ended
          </span>
          <h1 className="mt-[12px] style-section-header text-ink">
            Check-In Closed
          </h1>
          <p className="mt-[8px] style-body-text text-ink-muted leading-[20px]">
            <span className="font-semibold text-ink">{event.title}</span> has already concluded. Attendance tracking is no longer active.
          </p>
          <div className="mt-[24px]">
            <Link
              href={redirectTo}
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-brand px-4 py-[12px] style-caption font-medium text-white transition-colors hover:bg-brand-dark"
            >
              ← Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Check if user already has an RSVP, if NOT — auto-create it on the fly!
  let rsvp = await prisma.rSVP.findUnique({
    where: {
      userId_eventId: {
        userId: session.profile.userId,
        eventId: event.id,
      },
    },
  });

  if (!rsvp) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const qrToken = await generateQRToken({
      userId: session.profile.userId,
      eventId: event.id,
      ttl: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
      nonce: `${session.profile.userId}:${event.id}:${Date.now()}`,
    });

    rsvp = await prisma.rSVP.create({
      data: {
        userId: session.profile.userId,
        eventId: event.id,
        status: "GOING",
        qrToken,
        qrPayload: JSON.stringify({
          userId: session.profile.userId,
          eventId: event.id,
          token: qrToken,
          expiresAt: expiresAt.toISOString(),
        }),
        qrExpiresAt: expiresAt,
      },
    });
  } else if (rsvp.status !== "GOING") {
    // If they had a canceled RSVP, reactivate it to GOING
    rsvp = await prisma.rSVP.update({
      where: { id: rsvp.id },
      data: { status: "GOING" },
    });
  }

  // 6. Mark Attendance
  await prisma.attendance.upsert({
    where: { rsvpId: rsvp.id },
    update: {},
    create: {
      rsvpId: rsvp.id,
      checkedInAt: new Date(),
    },
  });

  // 7. Success Screen UI
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream p-6 text-center">
      <div className="w-full max-w-[420px] rounded-[16px] bg-[#d2ecd9] p-[36px] border border-[#b8dfc3]">
        <span className="style-caption font-semibold uppercase tracking-wider ">
          Verified
        </span>
        <h1 className="mt-[12px] style-section-header ">
          Checked In
        </h1>
        <p className="mt-[8px] style-body-text /80 leading-[20px]">
          You're all set for <span className="font-semibold ">{event.title}</span>. We automatically registered your spot and checked you in!
        </p>

        <div className="mt-[28px]">
          <Link
            href={redirectTo}
            className="inline-flex w-full items-center justify-center rounded-[10px] bg-[#2c5d3e] px-4 py-[12px] style-caption font-medium text-white transition-colors hover:bg-[#234b31]"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}