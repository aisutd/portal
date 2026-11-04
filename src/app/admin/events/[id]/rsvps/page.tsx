import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { SendReminderButton } from "@/components/admin/send-reminder-button";
import { RsvpExportButton } from "@/components/admin/rsvp-export-button";
import type { Prisma } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AIS Admin - Event RSVPs",
};

// --- Formatters (Explicitly bind Central Timezone) ---
const CHICAGO_TZ = "America/Chicago";

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", { 
  hour: "numeric", 
  minute: "2-digit",
  timeZone: CHICAGO_TZ,
});

const DATETIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: CHICAGO_TZ,
});

type RsvpWithUser = Prisma.RSVPGetPayload<{
  include: { attendance: true; user: { include: { profile: true } } };
}>;

// --- Inline UI Components ---
function StatusBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 style-caption text-[11px] font-bold uppercase tracking-wider ${bg} ${color}`}>
      {label}
    </span>
  );
}

function UserRow({ rsvp, isAttended, eventId, isPast }: { rsvp: RsvpWithUser; isAttended: boolean; eventId: string; isPast: boolean }) {
  const name = rsvp.user.profile
    ? `${rsvp.user.profile.prefName || rsvp.user.profile.firstName} ${rsvp.user.profile.lastName}`.trim()
    : rsvp.user.email.split("@")[0];

  const userId = rsvp.userId || rsvp.user.id;

  return (
    <Link
      href={`/admin/members/${userId}?from=/admin/events/${eventId}/rsvps`}
      className="group flex items-center justify-between border-b border-table-line last:border-0 p-4 transition-colors hover:bg-row-soft cursor-pointer"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="h-[40px] w-[40px] shrink-0 rounded-full border border-border-soft bg-gray-200" />
        <div className="flex flex-col min-w-0">
          <span className="style-label text-ink font-semibold group-hover:text-brand transition-colors truncate">{name}</span>
          <span className="style-caption text-ink-faint truncate">{rsvp.user.email}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
        {isAttended ? (
          <>
            <StatusBadge label="Checked In" bg="bg-emerald-50" color="text-emerald-700" />
            <span className="style-caption text-ink-faint">
              {TIME_FORMAT.format(rsvp.attendance!.checkedInAt)}
            </span>
          </>
        ) : (
          <StatusBadge
            label={isPast ? "Missed" : "Pending"}
            bg={isPast ? "bg-red-50" : "bg-gray-100"}
            color={isPast ? "text-red-700" : "text-gray-600"}
          />
        )}
      </div>
    </Link>
  );
}

// --- Data Fetcher ---
async function getEventDashboardData(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      lastReminderSentBy: {
        include: {
          profile: true,
        },
      },
      items: {
        include: {
          _count: { select: { scans: true } }
        }
      },
      rsvps: {
        where: { status: "GOING" },
        include: {
          attendance: true,
          user: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) return null;

  const attended = event.rsvps.filter((r) => r.attendance !== null);
  const unattended = event.rsvps.filter((r) => r.attendance === null);

  const totalRsvps = event.rsvps.length;
  const totalAttended = attended.length;
  const ratio = totalRsvps > 0 ? Math.round((totalAttended / totalRsvps) * 100) : 0;
  const isPast = event.endTime < new Date();

  const itemStats = event.items.reduce((acc, item) => {
    const type = item.type as string;
    if (!acc[type]) acc[type] = 0;
    acc[type] += item._count.scans;
    return acc;
  }, {} as Record<string, number>);

  return { event, attended, unattended, stats: { totalRsvps, totalAttended, ratio, isPast }, itemStats };
}

export default async function EventRsvpsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getEventDashboardData(id);
  const user = await getAuthenticatedUser();
  const userRole = user?.role;
  const canSendReminder = userRole === "DIRECTOR" || userRole === "EXECUTIVE";

  if (!data) notFound();

  const { event, attended, unattended, stats, itemStats } = data;

  const reminderSenderName = event.lastReminderSentBy
    ? event.lastReminderSentBy.profile
      ? `${event.lastReminderSentBy.profile.prefName || event.lastReminderSentBy.profile.firstName} ${event.lastReminderSentBy.profile.lastName}`.trim()
      : event.lastReminderSentBy.email.split("@")[0]
    : "System";

  return (
    <>
      {/* MOBILE VIEW */}
      <div className="md:hidden">
        <MobileScreen withBottomNavPadding={false}>
          <MobileAdminNav active="Events" />

          {/* Top Header Bar */}
          <div className="relative z-10 flex flex-col gap-3 pb-4">
            <div className="flex items-center gap-3">
              <Link 
                href="/admin/events" 
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-soft bg-white text-ink-faint hover:bg-gray-50"
              >
                <span aria-hidden>←</span>
              </Link>
              <div className="flex flex-col min-w-0 flex-1">
                <h2 className="style-card-title text-ink leading-tight truncate">{event.title}</h2>
                <span className="style-caption text-ink-faint">Attendance Dashboard</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              <RsvpExportButton eventId={event.id} eventTitle={event.title} />
              {canSendReminder && (
                <SendReminderButton
                  eventId={event.id}
                  eventTitle={event.title}
                  rsvpCount={stats.totalRsvps}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 pb-10">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white p-3 text-center shadow-sm">
                <span className="style-body-text font-bold text-ink">{stats.totalRsvps}</span>
                <span className="style-caption text-ink-faint">Total RSVPs</span>
              </div>
              <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white p-3 text-center shadow-sm">
                <span className="style-body-text font-bold text-emerald-700">{stats.totalAttended}</span>
                <span className="style-caption text-ink-faint">Attended</span>
              </div>
              <div className="flex flex-col rounded-2xl ring-[0.5px] ring-brand/20 bg-brand p-3 text-center shadow-sm">
                <span className="style-body-text font-bold text-white">{stats.ratio}%</span>
                <span className="style-caption text-white/80">Turnout</span>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white shadow-sm overflow-hidden">
              <div className="bg-row-soft border-b border-table-line p-4">
                <h2 className="style-caption font-bold uppercase tracking-wider text-ink-faint">Last Reminder Sent</h2>
              </div>
              <div className="flex flex-col p-4 gap-2">
                {event.lastReminderSentAt ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="style-caption text-ink-muted">Sent At</span>
                      <span className="style-body-text text-ink">
                        {DATETIME_FORMAT.format(event.lastReminderSentAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="style-caption text-ink-muted">Sent By</span>
                      <span className="style-body-text font-semibold text-ink">
                        {reminderSenderName}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="style-caption text-ink-muted text-center py-1">
                    No reminders sent yet.
                  </span>
                )}
              </div>
            </div>

            {Object.keys(itemStats).length > 0 && (
              <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white shadow-sm overflow-hidden">
                <div className="bg-row-soft border-b border-table-line p-4">
                  <h2 className="style-caption font-bold uppercase tracking-wider text-ink-faint">Items Scanned</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  {Object.entries(itemStats).map(([type, count]) => (
                    <div key={type} className="flex flex-col">
                      <span className="style-caption text-ink-faint">{type}</span>
                      <span className="style-body-text font-bold text-ink">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white shadow-sm overflow-hidden">
              <div className="bg-row-soft border-b border-table-line p-4 flex justify-between items-center">
                <h2 className="style-caption font-bold uppercase tracking-wider text-ink-faint">Checked In</h2>
                <span className="style-caption font-bold text-emerald-700">{attended.length}</span>
              </div>
              <div className="flex flex-col">
                {attended.length > 0 ? (
                  attended.map((r) => <UserRow key={r.id} rsvp={r} isAttended={true} eventId={event.id} isPast={stats.isPast} />)
                ) : (
                  <div className="p-5 text-center style-caption text-ink-muted">No check-ins yet.</div>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white shadow-sm overflow-hidden">
              <div className="bg-row-soft border-b border-table-line p-4 flex justify-between items-center">
                <h2 className="style-caption font-bold uppercase tracking-wider text-ink-faint">
                  {stats.isPast ? "Missed" : "Pending"}
                </h2>
                <span className="style-caption font-bold text-ink-muted">{unattended.length}</span>
              </div>
              <div className="flex flex-col">
                {unattended.length > 0 ? (
                  unattended.map((r) => <UserRow key={r.id} rsvp={r} isAttended={false} eventId={event.id} isPast={stats.isPast} />)
                ) : (
                  <div className="p-5 text-center style-caption text-ink-muted">Everyone checked in!</div>
                )}
              </div>
            </div>
          </div>
        </MobileScreen>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden min-h-screen w-full backdrop-blur-xl md:flex">
        <AdminSidebar active="Events" />

        <div className="flex h-full flex-1 flex-col gap-6 p-12 overflow-y-auto">
          {/* Top Header Section */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col min-w-0 flex-1">
              <Link href="/admin/events" className="style-caption text-brand hover:underline inline-flex items-center gap-1">
                ← Back to Events
              </Link>
              <h2 className="mt-1.5 style-section-header leading-tight text-ink truncate">
                {event.title} <span className="text-ink-faint font-normal">— RSVPs</span>
              </h2>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-1">
              <RsvpExportButton eventId={event.id} eventTitle={event.title} />
              {canSendReminder && (
                <SendReminderButton
                  eventId={event.id}
                  eventTitle={event.title}
                  rsvpCount={stats.totalRsvps}
                />
              )}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-[1fr_2.5fr] gap-6 items-start">
            <div className="flex flex-col gap-6 sticky top-12">
              <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-table-line p-5">
                  <h2 className="style-caption font-bold uppercase tracking-wider text-ink-faint">Attendance Overview</h2>
                </div>
                <div className="flex flex-col p-5 gap-4">
                  <div className="flex justify-between items-end">
                    <span className="style-caption text-ink-muted">Total RSVPs</span>
                    <span className="style-body-text font-bold text-ink leading-none">{stats.totalRsvps}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="style-caption text-ink-muted">Checked In</span>
                    <span className="style-body-text font-bold text-emerald-700 leading-none">{stats.totalAttended}</span>
                  </div>
                  <div className="h-[1px] w-full bg-border-soft" />
                  <div className="flex justify-between items-end">
                    <span className="style-caption text-ink-muted">Turnout Ratio</span>
                    <span className="style-body-text font-bold text-brand leading-none">{stats.ratio}%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-table-line p-5">
                  <h2 className="style-caption font-bold uppercase tracking-wider text-ink-faint">Last Reminder Sent</h2>
                </div>
                <div className="flex flex-col p-5 gap-3">
                  {event.lastReminderSentAt ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="style-caption text-ink-muted">Date & Time</span>
                        <span className="style-body-text text-ink">
                          {DATETIME_FORMAT.format(event.lastReminderSentAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="style-caption text-ink-muted">Sent By</span>
                        <span className="style-body-text font-semibold text-ink">
                          {reminderSenderName}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="style-caption text-ink-muted text-center py-2">
                      No reminder email has been sent yet.
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(itemStats).length > 0 && (
                <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white overflow-hidden shadow-sm">
                  <div className="border-b border-table-line p-5">
                    <h2 className="style-caption font-bold uppercase tracking-wider text-ink-faint">Items Dispensed</h2>
                  </div>
                  <div className="flex flex-col p-5 gap-3">
                    {Object.entries(itemStats).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="style-caption text-ink-muted">{type}</span>
                        <span className="style-body-text font-bold text-ink">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-table-line p-5 bg-row-soft">
                  <h2 className="style-caption font-bold uppercase tracking-wider text-ink-faint">Checked In</h2>
                  <StatusBadge label={`${attended.length} Members`} bg="bg-emerald-50" color="text-emerald-700" />
                </div>
                <div className="flex flex-col">
                  {attended.length > 0 ? (
                    attended.map((r) => <UserRow key={r.id} rsvp={r} isAttended={true} eventId={event.id} isPast={stats.isPast} />)
                  ) : (
                    <div className="p-10 text-center style-body-text text-ink-muted">No one has checked in yet.</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col rounded-2xl ring-[0.5px] ring-ink-faint/15 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-table-line p-5 bg-row-soft">
                  <h2 className="style-caption font-bold uppercase tracking-wider text-ink-faint">
                    {stats.isPast ? "Missed Event" : "Pending Check-in"}
                  </h2>
                  <StatusBadge label={`${unattended.length} Members`} bg="bg-gray-100" color="text-gray-600" />
                </div>
                <div className="flex flex-col">
                  {unattended.length > 0 ? (
                    unattended.map((r) => <UserRow key={r.id} rsvp={r} isAttended={false} eventId={event.id} isPast={stats.isPast} />)
                  ) : (
                    <div className="p-10 text-center style-body-text text-ink-muted">
                      {stats.totalRsvps > 0 ? "Everyone who RSVP'd checked in!" : "No RSVPs for this event."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}