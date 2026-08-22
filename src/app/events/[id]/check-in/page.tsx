import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface CheckInProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function CheckInPage({ searchParams }: CheckInProps) {
  const { token } = await searchParams;
  const session = await getAuthenticatedUser();

  if (!token) {
    return <div className="p-8 text-center text-red-600">Invalid check-in link.</div>;
  }

  // 1. Force login and preserve the token if signed out
  if (!session?.profile?.userId) {
    redirect(`/sign-in?callbackUrl=/check-in?token=${token}`);
  }

  // 2. Find the event using the unique token
  const event = await prisma.event.findUnique({
    where: { checkInToken: token },
  });

  if (!event) {
    return <div className="p-8 text-center text-red-600">Event not found.</div>;
  }

  // 3. Check if the event has already ended
  const now = new Date();
  if (now > event.endTime) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream p-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-red-600">Check-in Closed</h1>
          <p className="mt-2 text-sm text-ink-muted">
            This event (<span className="font-semibold text-ink">{event.title}</span>) has already ended. Check-in is no longer available.
          </p>
        </div>
      </div>
    );
  }

  // 4. Verify user has an RSVP
  const rsvp = await prisma.rSVP.findFirst({
    where: { eventId: event.id, userId: session.profile.userId },
  });

  if (!rsvp) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold">RSVP Required</h1>
        <p className="mt-2 text-sm text-muted-foreground">You must RSVP to this event before you can check in.</p>
      </div>
    );
  }

  // 5. Mark Attendance
  await prisma.attendance.upsert({
    where: { rsvpId: rsvp.id },
    update: {},
    create: {
      rsvpId: rsvp.id,
      checkedInAt: new Date(),
    },
  });

  // 6. Success Screen
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream p-6 text-center">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-ink">Checked In Successfully! 🎉</h1>
        <p className="mt-2 text-sm text-ink-muted">You are checked into <span className="font-semibold text-ink">{event.title}</span>.</p>
      </div>
    </div>
  );
}