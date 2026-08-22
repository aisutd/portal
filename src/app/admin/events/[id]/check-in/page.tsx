import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminQrDisplay } from "@/components/admin/admin-qr-display";

interface EventQrPageProps {
  params: Promise<{ id: string }>;
}

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", { 
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
      startTime: true, // 👈 Added startTime
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
          className="font-mono text-[12px] text-brand hover:underline"
        >
          ← Back to Events
        </Link>
      </div>

      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg border border-border-soft">
        <span className="rounded-full bg-brand-soft px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-brand">
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

            <div className="rounded-xl bg-cream-muted p-3 font-mono text-[11px] text-ink-faint break-all">
              {checkInUrl}
            </div>
          </>
        )}
      </div>
    </div>
  );
}