import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { SendReminderButton } from "@/components/admin/send-reminder-button";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "AIS Admin — Event RSVPs",
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
    <span className={`inline-flex items-center rounded-full px-[8px] py-[2px] style-caption md:font-bold uppercase tracking-[0.5px] ${bg} ${color}`}>
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
      className="flex items-center justify-between border-b border-table-line last:border-0 p-[16px] md:p-[20px] hover:bg-row-soft transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-[12px] md:gap-[16px]">
        <div className="size-[36px] md:size-[40px] shrink-0 rounded-full border border-border-soft bg-gray-200" />
        <div className="flex flex-col">
          <span className="style-body-text md:font-bold text-ink hover:underline">{name}</span>
          <span className="style-caption md:text-ink-faint">{rsvp.user.email}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-[4px]">
        {isAttended ? (
          <>
            <StatusBadge label="Checked In" bg="bg-green-50" color="text-green-700" />
            <span className="style-caption md:text-ink-faint">
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

          <div className="relative z-10 flex items-center justify-between pb-[16px] gap-[12px]">
            <div className="flex items-center gap-[12px] min-w-0 flex-1">
              <Link 
                href="/admin/events" 
                className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full border border-border-soft bg-white text-ink-faint hover:bg-gray-50"
              >
                <span aria-hidden>←</span>
              </Link>
              <div className="flex flex-col min-w-0 flex-1">
                <h2 className="style-mobile-title text-ink leading-tight truncate">{event.title}</h2>
                <span className="style-caption text-ink-faint">Attendance Dashboard</span>
              </div>
            </div>

            <div className="shrink-0">
              <SendReminderButton
                eventId={event.id}
                eventTitle={event.title}
                rsvpCount={stats.totalRsvps}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[16px] pb-[40px]">
            <div className="grid grid-cols-3 gap-[8px]">
              <div className="flex flex-col rounded-[12px] border border-border-soft bg-white p-[12px] text-center shadow-sm">
                <span className="style-body-text text-ink">{stats.totalRsvps}</span>
                <span className="style-caption text-ink-faint">Total RSVPs</span>
              </div>
              <div className="flex flex-col rounded-[12px] border border-border-soft bg-white p-[12px] text-center shadow-sm">
                <span className="style-body-text text-green-700">{stats.totalAttended}</span>
                <span className="style-caption text-ink-faint">Attended</span>
              </div>
              <div className="flex flex-col rounded-[12px] border border-border-soft bg-brand p-[12px] text-center shadow-sm">
                <span className="style-body-text text-white">{stats.ratio}%</span>
                <span className="style-caption text-white/80">Turnout</span>
              </div>
            </div>

            <div className="flex flex-col rounded-[14px] border border-border-soft bg-white shadow-sm overflow-hidden">
              <div className="bg-row-soft border-b border-table-line p-[16px]">
                <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Last Reminder Sent</h2>
              </div>
              <div className="flex flex-col p-[16px] gap-[8px]">
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
                      <span className="style-body-text font-bold text-ink">
                        {reminderSenderName}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="style-caption text-ink-muted text-center py-[4px]">
                    No reminders sent yet.
                  </span>
                )}
              </div>
            </div>

            {Object.keys(itemStats).length > 0 && (
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white shadow-sm overflow-hidden">
                <div className="bg-row-soft border-b border-table-line p-[16px]">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Items Scanned</h2>
                </div>
                <div className="grid grid-cols-2 gap-y-[12px] p-[16px]">
                  {Object.entries(itemStats).map(([type, count]) => (
                    <div key={type} className="flex flex-col">
                      <span className="style-caption text-ink-faint">{type}</span>
                      <span className="style-body-text text-ink">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col rounded-[14px] border border-border-soft bg-white shadow-sm overflow-hidden">
              <div className="bg-row-soft border-b border-table-line p-[16px] flex justify-between items-center">
                <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Checked In</h2>
                <span className="style-caption font-bold text-green-700">{attended.length}</span>
              </div>
              <div className="flex flex-col">
                {attended.length > 0 ? (
                  attended.map((r) => <UserRow key={r.id} rsvp={r} isAttended={true} eventId={event.id} isPast={stats.isPast} />)
                ) : (
                  <div className="p-[20px] text-center style-caption text-ink-muted">No check-ins yet.</div>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-[14px] border border-border-soft bg-white shadow-sm overflow-hidden">
              <div className="bg-row-soft border-b border-table-line p-[16px] flex justify-between items-center">
                <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">
                  {stats.isPast ? "Missed" : "Pending"}
                </h2>
                <span className="style-caption font-bold text-ink-muted">{unattended.length}</span>
              </div>
              <div className="flex flex-col">
                {unattended.length > 0 ? (
                  unattended.map((r) => <UserRow key={r.id} rsvp={r} isAttended={false} eventId={event.id} isPast={stats.isPast} />)
                ) : (
                  <div className="p-[20px] text-center style-caption text-ink-muted">Everyone checked in!</div>
                )}
              </div>
            </div>
          </div>
        </MobileScreen>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden min-h-screen w-full bg-cream md:flex">
        <AdminSidebar active="Events" />

        <div className="flex h-full flex-1 flex-col gap-[24px] p-[46px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/events" className="style-caption text-brand hover:underline">
                ← Back to Events
              </Link>
              <h2 className="mt-[6px] style-section-header leading-[1.1] tracking-[-0.4px] text-ink">
                {event.title} <span className="text-ink-faint font-normal">— RSVPs</span>
              </h2>
            </div>
            <SendReminderButton
              eventId={event.id}
              eventTitle={event.title}
              rsvpCount={stats.totalRsvps}
            />
          </div>

          <div className="grid grid-cols-[1fr_2.5fr] gap-[24px] items-start">
            <div className="flex flex-col gap-[24px] sticky top-[46px]">
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white overflow-hidden shadow-sm">
                <div className="border-b border-table-line p-[20px]">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Attendance Overview</h2>
                </div>
                <div className="flex flex-col p-[20px] gap-[16px]">
                  <div className="flex justify-between items-end">
                    <span className="style-caption text-ink-muted">Total RSVPs</span>
                    <span className="style-body-text text-ink leading-none">{stats.totalRsvps}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="style-caption text-ink-muted">Checked In</span>
                    <span className="style-body-text text-green-700 leading-none">{stats.totalAttended}</span>
                  </div>
                  <div className="h-[1px] w-full bg-border-soft" />
                  <div className="flex justify-between items-end">
                    <span className="style-caption text-ink-muted">Turnout Ratio</span>
                    <span className="style-body-text text-brand leading-none">{stats.ratio}%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white overflow-hidden shadow-sm">
                <div className="border-b border-table-line p-[20px]">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Last Reminder Sent</h2>
                </div>
                <div className="flex flex-col p-[20px] gap-[12px]">
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
                        <span className="style-body-text font-bold text-ink">
                          {reminderSenderName}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="style-caption text-ink-muted text-center py-[8px]">
                      No reminder email has been sent yet.
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(itemStats).length > 0 && (
                <div className="flex flex-col rounded-[14px] border border-border-soft bg-white overflow-hidden shadow-sm">
                  <div className="border-b border-table-line p-[20px]">
                    <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Items Dispensed</h2>
                  </div>
                  <div className="flex flex-col p-[20px] gap-[12px]">
                    {Object.entries(itemStats).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="style-caption text-ink-muted">{type}</span>
                        <span className="style-body-text text-ink">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-[24px]">
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-table-line p-[20px] bg-row-soft">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Checked In</h2>
                  <StatusBadge label={`${attended.length} Members`} bg="bg-green-50" color="text-green-700" />
                </div>
                <div className="flex flex-col">
                  {attended.length > 0 ? (
                    attended.map((r) => <UserRow key={r.id} rsvp={r} isAttended={true} eventId={event.id} isPast={stats.isPast} />)
                  ) : (
                    <div className="p-[40px] text-center style-body-text text-ink-muted">No one has checked in yet.</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-table-line p-[20px] bg-row-soft">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">
                    {stats.isPast ? "Missed Event" : "Pending Check-in"}
                  </h2>
                  <StatusBadge label={`${unattended.length} Members`} bg="bg-gray-100" color="text-gray-600" />
                </div>
                <div className="flex flex-col">
                  {unattended.length > 0 ? (
                    unattended.map((r) => <UserRow key={r.id} rsvp={r} isAttended={false} eventId={event.id} isPast={stats.isPast} />)
                  ) : (
                    <div className="p-[40px] text-center style-body-text text-ink-muted">
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