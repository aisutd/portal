import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface WorkshopCheckInPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function WorkshopCheckInPage({
  params,
  searchParams,
}: WorkshopCheckInPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  // 1. Ensure viewer is signed in (using getAuthenticatedUser to match event auth flow)
  const session = await getAuthenticatedUser();
  const userId = session?.id || session?.profile?.userId;

  if (!userId) {
    const checkInPath = `/academy/workshops/${id}/check-in?token=${token ?? ""}`;
    redirect(`/onboarding?mode=login&redirect_url=${encodeURIComponent(checkInPath)}`);
  }

  // 2. Query workshop
  const workshop = await prisma.workshop.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      checkInToken: true,
      isPublished: true,
    },
  });

  if (!workshop || !workshop.isPublished) {
    return notFound();
  }

  // 3. Validate check-in token
  const isValidToken = Boolean(token && workshop.checkInToken && token === workshop.checkInToken);

  // 4. Validate time window (allows check-in starting 1 hour before start through end time)
  const now = new Date();
  const oneHourBeforeStart = new Date(workshop.startTime.getTime() - 60 * 60 * 1000);
  const isOpen = now >= oneHourBeforeStart && now <= workshop.endTime;

  // 5. Check if member already checked in
  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      userId_workshopId: {
        userId,
        workshopId: workshop.id,
      },
    },
  });

  let status: "SUCCESS" | "ALREADY_CHECKED_IN" | "INVALID_TOKEN" | "CLOSED" = "SUCCESS";

  if (existingAttendance) {
    status = "ALREADY_CHECKED_IN";
  } else if (!isValidToken) {
    status = "INVALID_TOKEN";
  } else if (!isOpen) {
    status = "CLOSED";
  } else {
    // 6. Record attendance
    await prisma.attendance.create({
      data: {
        userId,
        workshopId: workshop.id,
      },
    });
  }

  // UI State: Success (First-time check-in)
  if (status === "SUCCESS") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-[420px] rounded-[16px] bg-[#d2ecd9] p-6 md:p-[36px] border border-[#b8dfc3]">
          <span className="style-caption font-semibold uppercase tracking-wider">
            Verified
          </span>
          <h1 className="mt-[12px] style-section-header">
            Checked In!
          </h1>
          <p className="mt-[8px] style-body-text leading-[20px]">
            You are checked in for <span className="font-semibold">{workshop.title}</span>. Attendance credit has been added to your profile.
          </p>

          <div className="mt-[28px]">
            <Link
              href={`/academy/workshops/${workshop.id}`}
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-[#2c5d3e] px-4 py-[12px] style-caption font-medium text-white transition-colors hover:bg-[#234b31]"
            >
              ← Return to Workshop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // UI State: Already Checked In
  if (status === "ALREADY_CHECKED_IN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-[420px] rounded-[16px] bg-white p-6 md:p-[36px] border border-border-soft shadow-sm">
          <span className="style-caption font-semibold uppercase tracking-wider text-ink-muted">
            Already Verified
          </span>
          <h1 className="mt-[12px] style-section-header text-ink">
            Already Checked In
          </h1>
          <p className="mt-[8px] style-body-text text-ink-muted leading-[20px]">
            You&apos;ve already received attendance credit for <span className="font-semibold text-ink">{workshop.title}</span>.
          </p>

          <div className="mt-[24px]">
            <Link
              href={`/academy/workshops/${workshop.id}`}
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-brand px-4 py-[12px] style-caption font-medium text-white transition-colors hover:bg-brand-dark"
            >
              ← Return to Workshop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // UI State: Invalid Token / QR Code
  if (status === "INVALID_TOKEN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-[420px] rounded-[16px] bg-white p-6 md:p-[36px] border border-border-soft shadow-sm">
          <span className="style-caption font-semibold uppercase tracking-wider text-red-600">
            Error
          </span>
          <h1 className="mt-[12px] style-section-header text-ink">
            Invalid Check-In Link
          </h1>
          <p className="mt-[8px] style-body-text text-ink-muted leading-[20px]">
            This check-in QR code or token is invalid or missing.
          </p>

          <div className="mt-[24px]">
            <Link
              href="/academy/workshops"
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-brand px-4 py-[12px] style-caption font-medium text-white transition-colors hover:bg-brand-dark"
            >
              ← Back to Workshops
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // UI State: Closed / Outside Time Window
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-[420px] rounded-[16px] bg-[#f4f1ea] p-6 md:p-[36px] border border-border-soft">
        <span className="style-caption font-semibold uppercase tracking-wider text-ink-faint">
          Ended
        </span>
        <h1 className="mt-[12px] style-section-header text-ink">
          Check-In Closed
        </h1>
        <p className="mt-[8px] style-body-text text-ink-muted leading-[20px]">
          Live check-in for <span className="font-semibold text-ink">{workshop.title}</span> is only available during the active workshop session window.
        </p>

        <div className="mt-[24px]">
          <Link
            href={`/academy/workshops/${workshop.id}`}
            className="inline-flex w-full items-center justify-center rounded-[10px] bg-brand px-4 py-[12px] style-caption font-medium text-white transition-colors hover:bg-brand-dark"
          >
            ← Return to Workshop
          </Link>
        </div>
      </div>
    </div>
  );
}