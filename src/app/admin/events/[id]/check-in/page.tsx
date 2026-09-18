{/*
  There are **three major functional/architectural issues** in these two Next.js App Router files that will break production behavior:

**1. URL Route Mismatch (Critical Breakage)**

* **The Bug:** In `EventQrPage`, the generated check-in URL is `${baseUrl}/events/${id}/check-in?token=${event.checkInToken}`. However, `CheckInPage` does not use the `id` param anywhere and assumes its route receives `token` directly via `searchParams`.
* **The Impact:** If your route directory structure is `app/events/[id]/check-in/page.tsx`, `CheckInPage` won't validate that the event ID in the URL matches the token's event ID, opening the door for bad data or broken links if params are mismatched. If your route is actually `app/events/check-in/page.tsx`, the generated QR URL points to a non-existent route (`404`).

**2. Missing Early-Arrival Enforcement on Check-In**

* **The Bug:** `EventQrPage` prevents the QR code from *displaying* if it is earlier than 1 hour before `startTime`. However, `CheckInPage` only validates `now > event.endTime`.
* **The Impact:** If a user bookmarks or copies the link (or scans a QR code that was generated early in testing), they can check in days or weeks before the event starts. `CheckInPage` lacks the corresponding `now < oneHourBeforeStart` check.

**3. Database Side Effects During Server Component Rendering**

* **The Bug:** `CheckInPage` is a Next.js React Server Component executing `prisma.rSVP.create`, `update`, and `prisma.attendance.upsert` directly in the rendering body.
* **The Impact:** Server Components should be pure for rendering. Pre-fetching (e.g., Next.js link prefetching or browser speculative loads) will execute these mutations automatically before a user even visits the page, creating unintended RSVP and attendance records in your database.

---

### Additional Minor Issues & Fixes

* **Tailwind Class Error:** In `CheckInPage`, step 8 has an invalid CSS class syntax: `<p className="mt-[8px] style-body-text /80 leading-[20px]">`. The `/80` is broken Tailwind opacity syntax (missing a text/bg prefix).
* **Missing Transaction:** Creating/updating the RSVP and upserting the Attendance happen as separate sequential queries. They should be wrapped in `prisma.$transaction([...])` to avoid orphaned records if one write fails.

---

### Key Recommendations

1. **Move Mutations to Route Handlers:** Change `CheckInPage` to perform reads only, or handle the check-in mutation inside a Server Action / API Route (`app/api/check-in/route.ts`) triggered by a user action or an explicit GET route handler redirect.
2. **Align the URL Specs:** Decide whether the route is `/events/check-in?token=...` or `/events/[id]/check-in?token=...` and sync both files to use identical parameter formats.
3. **Mirror Time Checks:** Copy the `isTooEarly` validation logic from `EventQrPage` into `CheckInPage` to prevent premature check-ins.
  */}

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminQrDisplay } from "@/components/admin/admin-qr-display";

interface EventQrPageProps {
  params: Promise<{ id: string }>;
}

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", { 
  timeZone: "America/Chicago", 
  month: "short", 
  day: "numeric", 
  hour: "numeric", 
  minute: "2-digit" 
});

export default async function EventQrPage({ params }: EventQrPageProps) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      checkInToken: true,
    },
  });

  if (!event || !event.checkInToken) {
    return notFound();
  }

  // Calculate if it's currently within 1 hour before start time (or during the event)
  const now = new Date();
  const oneHourBeforeStart = new Date(event.startTime.getTime() - 60 * 60 * 1000);
  const isTooEarly = now < oneHourBeforeStart;

  // Construct the full public check-in URL dynamically
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portal.aisutd.org";
  const checkInUrl = `${baseUrl}/events/${id}/check-in?token=${event.checkInToken}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream p-6">
      <div className="absolute top-6 left-6">
        <Link
          href={`/admin/events`}
          className="style-caption text-brand hover:underline"
        >
          ← Back to Events
        </Link>
      </div>

      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg border border-border-soft">
        <span className="rounded-full bg-brand-soft px-3 py-1 style-caption font-bold uppercase tracking-wider text-brand">
          Live Check-In
        </span>
        
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">
          {event.title}
        </h1>
        
        {isTooEarly ? (
          <div className="my-8 flex flex-col items-center gap-3 rounded-2xl bg-amber-50 p-6 border border-amber-200 text-amber-900">
            <span className="font-bold text-sm">Check-in not open yet</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              QR check-in will become available 1 hour before the event starts at{" "}
              <strong className="font-semibold">{TIME_FORMAT.format(event.startTime)}</strong>.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-muted">
              Scan with your phone camera to check in
            </p>

            {/* QR Code Component (Client side rendered) */}
            <div className="my-8 flex justify-center">
              <AdminQrDisplay url={checkInUrl} />
            </div>

            <div className="rounded-xl bg-cream-muted p-3 style-caption text-ink-faint break-all">
              {checkInUrl}
            </div>
          </>
        )}
      </div>
    </div>
  );
}