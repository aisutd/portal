import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { Badge } from "@/components/ui/badge";
import { getAuthenticatedUser } from "@/lib/auth";
import { canManageRoles } from "@/lib/roles";
import { MemberRolesEditor } from "@/components/admin/member-roles-editor";

export const metadata: Metadata = {
  title: "AIS Admin — Member Profile",
};

// --- Formatters ---
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric" });
const TIME_FORMAT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function formatDisplayString(str: string | null | undefined): string {
  return str && str.trim().length > 0 ? str : "—";
}

// --- Data Fetcher ---
async function getFullMemberDetails(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: {
        include: { resumeFile: true },
      },
      memberships: {
        orderBy: { startDate: "desc" },
      },
      rsvps: {
        include: { event: true, attendance: true },
        orderBy: { event: { startTime: "desc" } },
      },
      createdEvents: {
        orderBy: { startTime: "desc" },
        take: 5,
      },
      submissions: {
        include: { application: true },
        orderBy: { submittedAt: "desc" },
      },
      auditLogs: {
        where: { actorUserId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) return null;

  const now = new Date();
  const attendedCount = user.rsvps.filter((r) => r.attendance !== null).length;
  const missedCount = user.rsvps.filter((r) => r.attendance === null && r.status === "GOING" && r.event.endTime < now).length;
  const upcomingCount = user.rsvps.filter((r) => r.status === "GOING" && r.event.endTime >= now).length;

  return {
    ...user,
    stats: { attendedCount, missedCount, upcomingCount },
  };
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [member, viewer] = await Promise.all([
    getFullMemberDetails(id),
    getAuthenticatedUser(),
  ]);

  if (!member) notFound();

  const editable = canManageRoles(viewer?.role);
  const name = member.profile 
    ? `${member.profile.prefName || member.profile.firstName} ${member.profile.lastName}`.trim() 
    : member.email.split("@")[0];

  const uniquePrograms = Array.from(new Set(member.memberships.map((m) => m.membershipType)));

  return (
    <>
      {/* ================================================================= */}
      {/* MOBILE VIEW */}
      {/* ================================================================= */}
      <div className="md:hidden">
        <MobileScreen withBottomNavPadding={false}>
          <MobileAdminNav active="Members" />

          {/* Header */}
          <div className="flex items-center justify-between pb-[16px]">
            <div className="flex items-center gap-[12px]">
              <Link href="/admin/members" className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-border-soft bg-white text-ink-faint hover:bg-gray-50">
                <span aria-hidden>←</span>
              </Link>
              <h2 className="font-mobile-display text-[20px] font-bold text-ink">Profile</h2>
            </div>
            
            {editable && (
              <div className="flex items-center gap-[6px] rounded-full border border-border-soft bg-white pl-[12px] pr-[4px] py-[4px] shadow-sm">
                <span className="font-mono text-[11px] text-ink-faint">Manage</span>
                <MemberRolesEditor 
                  memberId={member.id}
                  memberName={name}
                  role={member.role}
                  programs={uniquePrograms} 
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-[16px] pb-[40px]">
            {/* Mobile Profile Hero */}
            <div className="flex flex-col items-center gap-[12px] rounded-[16px] border border-border-soft bg-white p-[24px] text-center shadow-sm">
              <div className="size-[80px] shrink-0 rounded-full border-[2px] border-border-soft bg-photo" />
              <div>
                <h1 className="font-mobile-body text-[22px] font-bold text-ink">{name}</h1>
                <p className="font-mono text-[12px] text-ink-muted mb-[4px]">{member.email}</p>
                <p className="font-mono text-[10px] text-ink-faint">Joined {DATE_FORMAT.format(member.createdAt)}</p>
              </div>
              <Badge label={member.role} bg="bg-brand-soft" color="text-brand" />
            </div>

            {/* Mobile Stats */}
            <div className="grid grid-cols-3 gap-[8px]">
              <div className="flex flex-col rounded-[12px] border border-border-soft bg-white p-[12px] text-center shadow-sm">
                <span className="font-body text-[18px] font-bold text-ink">{member.stats.attendedCount}</span>
                <span className="font-mono text-[10px] text-ink-faint">Attended</span>
              </div>
              <div className="flex flex-col rounded-[12px] border border-border-soft bg-white p-[12px] text-center shadow-sm">
                <span className="font-body text-[18px] font-bold text-ink">{member.stats.missedCount}</span>
                <span className="font-mono text-[10px] text-ink-faint">Missed</span>
              </div>
              <div className="flex flex-col rounded-[12px] border border-border-soft bg-white p-[12px] text-center shadow-sm">
                <span className="font-body text-[18px] font-bold text-ink">{member.stats.upcomingCount}</span>
                <span className="font-mono text-[10px] text-ink-faint">Upcoming</span>
              </div>
            </div>

            {/* Mobile Academic Profile */}
            <div className="flex flex-col rounded-[14px] border border-border-soft bg-white shadow-sm overflow-hidden">
              <div className="bg-row-soft border-b border-table-line p-[16px] flex items-center justify-between">
                <h2 className="font-techno text-[11px] uppercase tracking-[1px] text-ink-faint">Academic</h2>
                {member.profile?.resumeFile && (
                  <a href={`/api/files/${member.profile.resumeFile.id}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-brand hover:underline">
                    View Resume ↗
                  </a>
                )}
              </div>
              <div className="flex flex-col gap-[12px] p-[16px]">
                <InfoRow label="Major" value={member.profile?.major} mobile />
                <InfoRow label="Degree" value={member.profile?.degree} mobile />
                <InfoRow label="Grad Year" value={member.profile?.year} mobile />
                <InfoRow label="NetID" value={member.profile?.utdNetId} mobile />
              </div>
            </div>

            {/* Mobile Application Submissions */}
            {member.submissions.length > 0 && (
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white shadow-sm overflow-hidden">
                <div className="bg-row-soft border-b border-table-line p-[16px]">
                  <h2 className="font-techno text-[11px] uppercase tracking-[1px] text-ink-faint">Applications</h2>
                </div>
                <div className="flex flex-col">
                  {member.submissions.map((sub) => (
                    <div key={sub.id} className="flex flex-col gap-[6px] border-b border-table-line last:border-0 p-[16px]">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-[14px] font-bold text-ink">{sub.application.title}</span>
                        <Badge label={sub.status.replace(/_/g, " ")} bg="bg-gray-100" color="text-gray-600" />
                      </div>
                      <span className="font-mono text-[11px] text-ink-faint">Submitted {DATE_FORMAT.format(sub.submittedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile RSVPs */}
            <div className="flex flex-col rounded-[14px] border border-border-soft bg-white shadow-sm overflow-hidden">
              <div className="bg-row-soft border-b border-table-line p-[16px]">
                <h2 className="font-techno text-[11px] uppercase tracking-[1px] text-ink-faint">Recent RSVPs</h2>
              </div>
              <div className="flex flex-col">
                {member.rsvps.slice(0, 5).length > 0 ? (
                  member.rsvps.slice(0, 5).map((rsvp) => {
                    const isPast = rsvp.event.endTime < new Date();
                    let badge = { label: "Upcoming", bg: "bg-blue-50", color: "text-blue-700" };
                    if (rsvp.status === "CANCELED") badge = { label: "Canceled", bg: "bg-gray-100", color: "text-gray-500" };
                    else if (rsvp.attendance) badge = { label: "Attended", bg: "bg-green-50", color: "text-green-700" };
                    else if (isPast) badge = { label: "Missed", bg: "bg-red-50", color: "text-red-700" };

                    return (
                      <div key={rsvp.id} className="flex flex-col gap-[8px] p-[16px] border-b border-table-line last:border-0">
                        <div className="flex items-start justify-between gap-[12px]">
                          <span className="font-body text-[14px] font-bold text-ink leading-[1.3]">{rsvp.event.title}</span>
                          <div className="shrink-0">
                            <Badge label={badge.label} bg={badge.bg} color={badge.color} />
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-ink-faint">{TIME_FORMAT.format(rsvp.event.startTime)}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-[24px] text-center font-body text-[14px] text-ink-muted">No RSVPs found.</div>
                )}
              </div>
            </div>
            
          </div>
        </MobileScreen>
      </div>

      {/* ================================================================= */}
      {/* DESKTOP VIEW */}
      {/* ================================================================= */}
      <div className="hidden min-h-screen w-full bg-cream md:flex">
        <AdminSidebar active="Members" role={viewer?.role} />

        <div className="flex h-full flex-1 flex-col gap-[24px] p-[46px] overflow-y-auto">
          {/* Header & Actions */}
          <div className="flex items-center justify-between">
            <Link href="/admin/members" className="flex items-center gap-[8px] font-mono text-[13px] text-ink-faint transition-colors hover:text-ink">
              <span aria-hidden>←</span> Back to Members
            </Link>
            
            <div className="flex items-center gap-[12px]">
              {editable && (
                <div className="flex items-center gap-[8px] rounded-[8px] border border-border-soft bg-white px-[12px] py-[6px] shadow-sm">
                  <span className="font-mono text-[12px] text-ink-faint">Manage User</span>
                  <MemberRolesEditor 
                    memberId={member.id}
                    memberName={name}
                    role={member.role}
                    programs={uniquePrograms} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Profile Header */}
          <div className="flex items-center gap-[24px] rounded-[14px] border border-border-soft bg-white p-[32px]">
            <div className="size-[90px] shrink-0 rounded-full border border-border-soft bg-photo" />
            <div className="flex flex-col gap-[8px]">
              <h1 className="font-display text-[36px] font-bold leading-[1.1] tracking-[-0.5px] text-ink">{name}</h1>
              <div className="flex flex-wrap items-center gap-[12px] font-mono text-[14px] text-ink-muted">
                <span>{member.email}</span>
                <span className="h-[4px] w-[4px] rounded-full bg-ink-faint" />
                <span>Joined: {DATE_FORMAT.format(member.createdAt)}</span>
              </div>
            </div>
            <div className="ml-auto">
              <Badge label={`System Role: ${member.role}`} bg="bg-brand-soft" color="text-brand" />
            </div>
          </div>

          <div className="grid grid-cols-[1.2fr_2fr] gap-[24px] items-start">
            
            {/* ============================================================== */}
            {/* LEFT COLUMN: Profile, Docs, Programs */}
            {/* ============================================================== */}
            <div className="flex flex-col gap-[24px]">
              
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                <div className="flex items-center justify-between border-b border-table-line p-[20px]">
                  <h2 className="font-techno text-[12px] uppercase tracking-[1px] text-ink-faint">Academic Profile</h2>
                  {member.profile?.resumeFile && (
                    <a href={`/api/files/${member.profile.resumeFile.id}`} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-brand hover:underline">
                      Download Resume ↗
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-[16px] p-[20px]">
                  <InfoRow label="Major" value={member.profile?.major} />
                  <InfoRow label="Degree" value={member.profile?.degree} />
                  <InfoRow label="Grad Year" value={member.profile?.year} />
                  <InfoRow label="UTD NetID" value={member.profile?.utdNetId} />
                </div>
              </div>

              {/* Application Submissions */}
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                <div className="border-b border-table-line p-[20px]">
                  <h2 className="font-techno text-[12px] uppercase tracking-[1px] text-ink-faint">Applications</h2>
                </div>
                <div className="flex flex-col">
                  {member.submissions.length > 0 ? (
                    member.submissions.map((sub) => (
                      <div key={sub.id} className="flex flex-col gap-[4px] border-b border-table-line last:border-0 p-[20px]">
                        <div className="flex items-center justify-between">
                          <span className="font-body text-[15px] font-bold text-ink">{sub.application.title}</span>
                          <Badge label={sub.status.replace(/_/g, " ")} bg="bg-gray-100" color="text-gray-600" />
                        </div>
                        <span className="font-mono text-[12px] text-ink-faint">Submitted {DATE_FORMAT.format(sub.submittedAt)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-[20px] text-center font-mono text-[13px] text-ink-muted">No applications submitted.</div>
                  )}
                </div>
              </div>
              
              {/* System Audit Logs */}
              {member.auditLogs.length > 0 && (
                <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                  <div className="border-b border-table-line p-[20px]">
                    <h2 className="font-techno text-[12px] uppercase tracking-[1px] text-ink-faint">Recent System Activity</h2>
                  </div>
                  <div className="flex flex-col p-[20px] gap-[12px]">
                    {member.auditLogs.map((log) => (
                      <div key={log.id} className="flex justify-between items-start gap-[8px]">
                        <span className="font-body text-[13px] text-ink">{log.actionType}</span>
                        <span className="font-mono text-[10px] text-ink-faint whitespace-nowrap">{DATE_FORMAT.format(log.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* RIGHT COLUMN: Events (RSVPs & Created) */}
            {/* ============================================================== */}
            <div className="flex flex-col gap-[24px]">
              
              {/* Created Events */}
              {member.role !== "MEMBER" && member.createdEvents.length > 0 && (
                <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                  <div className="flex items-center justify-between border-b border-table-line p-[20px]">
                    <h2 className="font-techno text-[12px] uppercase tracking-[1px] text-ink-faint">Events Organized</h2>
                    <span className="font-mono text-[12px] text-brand">{member.createdEvents.length} Total</span>
                  </div>
                  <div className="flex flex-col">
                    {member.createdEvents.map((evt) => (
                      <div key={evt.id} className="flex items-center justify-between p-[20px] border-b border-table-line last:border-0 hover:bg-row-soft transition-colors">
                        <div className="flex flex-col gap-[4px]">
                          <span className="font-body text-[15px] font-bold text-ink">{evt.title}</span>
                          <span className="font-mono text-[12px] text-ink-faint">{TIME_FORMAT.format(evt.startTime)}</span>
                        </div>
                        <Badge label={evt.status} bg="bg-gray-100" color="text-gray-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event RSVPs */}
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                <div className="flex items-center justify-between border-b border-table-line p-[20px]">
                  <h2 className="font-techno text-[12px] uppercase tracking-[1px] text-ink-faint">RSVPs & Attendance</h2>
                  <div className="flex gap-[12px] font-mono text-[12px]">
                    <span className="text-green-700">{member.stats.attendedCount} Attended</span>
                    <span className="text-ink-faint">·</span>
                    <span className="text-red-600">{member.stats.missedCount} Missed</span>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  {member.rsvps.length > 0 ? (
                    member.rsvps.map((rsvp) => {
                      const isPast = rsvp.event.endTime < new Date();
                      let badge = { label: "Upcoming", bg: "bg-blue-50", color: "text-blue-700" };
                      if (rsvp.status === "CANCELED") badge = { label: "Canceled", bg: "bg-gray-100", color: "text-gray-500" };
                      else if (rsvp.attendance) badge = { label: "Attended", bg: "bg-green-50", color: "text-green-700" };
                      else if (isPast) badge = { label: "Missed", bg: "bg-red-50", color: "text-red-700" };

                      return (
                        <div key={rsvp.id} className="flex items-center justify-between p-[20px] border-b border-table-line last:border-0 hover:bg-row-soft transition-colors">
                          <div className="flex flex-col gap-[6px]">
                            <span className="font-body text-[15px] font-bold text-ink">{rsvp.event.title}</span>
                            <div className="flex items-center gap-[8px] font-mono text-[12px] text-ink-faint">
                              <span>{TIME_FORMAT.format(rsvp.event.startTime)}</span>
                              {rsvp.attendance && (
                                <>
                                  <span className="h-[3px] w-[3px] rounded-full bg-ink-faint" />
                                  <span>Checked in at {TIME_FORMAT.format(rsvp.attendance.checkedInAt)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge label={badge.label} bg={badge.bg} color={badge.color} />
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-[40px] text-center font-body text-[15px] text-ink-muted">
                      This user has not RSVP'd to any events.
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

// Helper to standardise InfoRow layout across mobile and desktop
function InfoRow({ label, value, mobile = false }: { label: string; value?: string | null; mobile?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-[16px]">
      <span className={`font-mono text-ink-faint shrink-0 ${mobile ? 'text-[12px]' : 'text-[13px]'}`}>{label}</span>
      <span className={`font-body font-medium text-ink text-right truncate ${mobile ? 'text-[13px]' : 'text-[14px]'}`}>
        {formatDisplayString(value)}
      </span>
    </div>
  );
}