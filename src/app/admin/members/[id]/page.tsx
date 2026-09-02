import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
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

// --- Complete Data Fetcher ---
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
      drafts: {
        include: { application: true },
        orderBy: { lastSavedAt: "desc" },
      },
      reviews: {
        include: { submission: { include: { user: { include: { profile: true } } } } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
      createdApps: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      itemScans: {
        include: { eventItem: true },
        orderBy: { scannedAt: "desc" },
        take: 5,
      },
      uploadedFiles: {
        orderBy: { createdAt: "desc" },
        take: 5,
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

export default async function MemberProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const rawRedirect =
    typeof resolvedSearchParams.redirectUrl === "string"
      ? decodeURIComponent(resolvedSearchParams.redirectUrl)
      : typeof resolvedSearchParams.from === "string"
      ? decodeURIComponent(resolvedSearchParams.from)
      : null;

  const backUrl = rawRedirect && rawRedirect.startsWith("/") ? rawRedirect : "/admin/members";
  const backLabel = backUrl.includes("/rsvps") ? "Back to Event RSVPs" : "Back to Members";

  const now = new Date();

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
    <div className="flex min-h-screen w-full bg-cream">
      {/* Sidebar hidden on mobile */}
      <div className="hidden md:block">
        <AdminSidebar active="Members" role={viewer?.role} />
      </div>

      <div className="flex h-full flex-1 flex-col gap-[16px] md:gap-[24px] p-[16px] md:p-[46px] overflow-y-auto">
        {/* Mobile Navigation Header */}
        <div className="md:hidden">
          <MobileAdminNav active="Members" />
        </div>

        {/* Header & Actions */}
        <div className="flex items-center justify-between">
          <Link href={backUrl} className="flex items-center gap-[8px] style-caption text-ink-faint transition-colors hover:text-ink">
            <span aria-hidden>←</span> {backLabel}
          </Link>

          {editable && (
            <div className="flex items-center gap-[8px] rounded-[8px] border border-border-soft bg-white px-[12px] py-[6px] shadow-sm">
              <span className="style-caption text-ink-faint">Manage User</span>
              <MemberRolesEditor
                memberId={member.id}
                memberName={name}
                role={member.role}
                programs={uniquePrograms}
              />
            </div>
          )}
        </div>

        {/* Profile Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-[16px] md:gap-[24px] rounded-[14px] border border-border-soft bg-white p-[20px] md:p-[32px] text-center md:text-left">
          <div className="size-[80px] md:size-[90px] shrink-0 rounded-full border border-border-soft bg-photo" />
          <div className="flex flex-col gap-[6px] md:gap-[8px]">
            <h1 className="style-section-header leading-[1.1] tracking-[-0.5px] text-ink">{name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-[8px] md:gap-[12px] style-caption text-ink-muted">
              <span>{member.email}</span>
              <span className="h-[4px] w-[4px] rounded-full bg-ink-faint" />
              <span>Joined: {DATE_FORMAT.format(member.createdAt)}</span>
              <span className="h-[4px] w-[4px] rounded-full bg-ink-faint" />
              <span>Last Login: {member.lastLoginAt ? DATE_FORMAT.format(member.lastLoginAt) : "Never"}</span>
            </div>
          </div>
          <div className="md:ml-auto flex flex-wrap md:flex-col items-center md:items-end gap-2 justify-center">
            <Badge label={`System Role: ${member.role}`} bg="bg-brand-soft" color="text-brand" />
            {member.team && <Badge label={`Team: ${member.team}`} bg="bg-gray-100" color="text-gray-700" />}
            {member.verifiedAt ? (
              <span className="style-caption text-green-600">✓ Verified</span>
            ) : (
              <span className="style-caption text-amber-600">Unverified</span>
            )}
          </div>
        </div>

        {/* Attendance Stats Cards */}
        <div className="grid grid-cols-3 gap-[12px]">
          <div className="flex flex-col rounded-[12px] border border-border-soft bg-white p-[12px] text-center shadow-sm">
            <span className="style-body-text font-bold text-ink">{member.stats.attendedCount}</span>
            <span className="style-caption text-ink-faint">Attended</span>
          </div>
          <div className="flex flex-col rounded-[12px] border border-border-soft bg-white p-[12px] text-center shadow-sm">
            <span className="style-body-text font-bold text-ink">{member.stats.missedCount}</span>
            <span className="style-caption text-ink-faint">Missed</span>
          </div>
          <div className="flex flex-col rounded-[12px] border border-border-soft bg-white p-[12px] text-center shadow-sm">
            <span className="style-body-text font-bold text-ink">{member.stats.upcomingCount}</span>
            <span className="style-caption text-ink-faint">Upcoming</span>
          </div>
        </div>

        {/* Main Content Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_2fr] gap-[24px] items-start">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-[24px]">
            {/* Academic & Contact */}
            <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
              <div className="flex items-center justify-between border-b border-table-line p-[20px]">
                <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Academic & Contact</h2>
                {member.profile?.resumeFile && (
                  <a
                    href={`${process.env.R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${member.profile.resumeFile.storageKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-brand hover:underline style-caption"
                  >
                    View Resume ↗
                  </a>
                )}
              </div>
              <div className="flex flex-col gap-[16px] p-[20px]">
                <InfoRow label="Major" value={member.profile?.major} />
                <InfoRow label="Degree" value={member.profile?.degree} />
                <InfoRow label="Grad Year" value={member.profile?.year} />
                <InfoRow label="UTD NetID" value={member.profile?.utdNetId} />
                <InfoRow label="UTD Email" value={member.profile?.utdEmail} />
                <InfoRow label="Personal Email" value={member.profile?.personalEmail} />
                <InfoRow label="Phone" value={member.profile?.phoneNumber} />
                <InfoRow label="Profile Status" value={member.profile?.profileCompletionStatus} />
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
              <div className="border-b border-table-line p-[20px]">
                <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Social Links</h2>
              </div>
              <div className="flex flex-col gap-[12px] p-[20px]">
                <LinkRow label="GitHub" url={member.profile?.githubUrl} />
                <LinkRow label="LinkedIn" url={member.profile?.linkedinUrl} />
                <LinkRow label="Portfolio" url={member.profile?.portfolioUrl} />
              </div>
            </div>

            {/* Memberships */}
            <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
              <div className="border-b border-table-line p-[20px]">
                <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Memberships</h2>
              </div>
              <div className="flex flex-col">
                {member.memberships.length > 0 ? (
                  member.memberships.map((m) => (
                    <div key={m.id} className="flex items-center justify-between border-b border-table-line last:border-0 p-[16px]">
                      <div className="flex flex-col">
                        <span className="style-body-text text-ink font-medium">{m.membershipType}</span>
                        <span className="style-caption text-ink-faint">
                          {DATE_FORMAT.format(m.startDate)} {m.endDate ? `- ${DATE_FORMAT.format(m.endDate)}` : ""}
                        </span>
                      </div>
                      <Badge
                        label={m.activeFlag ? "Active" : "Inactive"}
                        bg={m.activeFlag ? "bg-green-50" : "bg-gray-100"}
                        color={m.activeFlag ? "text-green-700" : "text-gray-500"}
                      />
                    </div>
                  ))
                ) : (
                  <div className="p-[20px] text-center style-caption text-ink-muted">No program memberships.</div>
                )}
              </div>
            </div>

            {/* Uploaded Files */}
            {member.uploadedFiles.length > 0 && (
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                <div className="border-b border-table-line p-[20px]">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Uploaded Files</h2>
                </div>
                <div className="flex flex-col">
                  {member.uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between border-b border-table-line last:border-0 p-[16px]">
                      <div className="flex flex-col truncate pr-2">
                        <span className="style-body-text text-ink truncate">{file.fileName}</span>
                        <span className="style-caption text-ink-faint">{(file.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                      <a
                        href={`${process.env.R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${file.storageKey}`}
                        target="_blank"
                        rel="noreferrer"
                        className="style-caption text-brand hover:underline shrink-0"
                      >
                        Download ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Audit Logs */}
            {member.auditLogs.length > 0 && (
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                <div className="border-b border-table-line p-[20px]">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Recent System Activity</h2>
                </div>
                <div className="flex flex-col p-[20px] gap-[12px]">
                  {member.auditLogs.map((log) => (
                    <div key={log.id} className="flex justify-between items-start gap-[8px]">
                      <span className="style-body-text text-ink">{log.actionType}</span>
                      <span className="style-caption text-ink-faint whitespace-nowrap">{DATE_FORMAT.format(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-[24px]">
            {/* Event RSVPs */}
            <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
              <div className="flex items-center justify-between border-b border-table-line p-[20px]">
                <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">RSVPs & Attendance</h2>
                <div className="flex gap-[12px] style-caption">
                  <span className="text-green-700">{member.stats.attendedCount} Attended</span>
                  <span className="text-ink-faint">·</span>
                  <span className="text-red-600">{member.stats.missedCount} Missed</span>
                </div>
              </div>

              <div className="flex flex-col">
                {member.rsvps.length > 0 ? (
                  member.rsvps.map((rsvp) => {
                    const isPast = rsvp.event.endTime < now;
                    let badge = { label: "Upcoming", bg: "bg-blue-50", color: "text-blue-700" };
                    if (rsvp.status === "CANCELED") badge = { label: "Canceled", bg: "bg-gray-100", color: "text-gray-500" };
                    else if (rsvp.attendance) badge = { label: "Attended", bg: "bg-green-50", color: "text-green-700" };
                    else if (isPast) badge = { label: "Missed", bg: "bg-red-50", color: "text-red-700" };

                    return (
                      <div key={rsvp.id} className="flex items-center justify-between p-[20px] border-b border-table-line last:border-0 hover:bg-row-soft transition-colors">
                        <div className="flex flex-col gap-[6px]">
                          <span className="style-body-text text-ink">{rsvp.event.title}</span>
                          <div className="flex items-center gap-[8px] style-caption text-ink-faint">
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
                  <div className="p-[40px] text-center style-body-text text-ink-muted">
                    This user has not RSVP&apos;d to any events.
                  </div>
                )}
              </div>
            </div>

            {/* Submissions & Drafts */}
            <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
              <div className="border-b border-table-line p-[20px]">
                <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Applications & Drafts</h2>
              </div>
              <div className="flex flex-col">
                {member.submissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between border-b border-table-line p-[20px] hover:bg-row-soft">
                    <div className="flex flex-col gap-[4px]">
                      <span className="style-body-text text-ink">{sub.application.title}</span>
                      <span className="style-caption text-ink-faint">Submitted {DATE_FORMAT.format(sub.submittedAt)}</span>
                    </div>
                    <Badge label={sub.status.replace(/_/g, " ")} bg="bg-gray-100" color="text-gray-600" />
                  </div>
                ))}
                {member.drafts.map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between border-b border-table-line last:border-0 p-[20px] bg-amber-50/20">
                    <div className="flex flex-col gap-[4px]">
                      <span className="style-body-text text-ink">{draft.application.title} (Draft)</span>
                      <span className="style-caption text-ink-faint">Step {draft.stepIndex + 1} · Saved {DATE_FORMAT.format(draft.lastSavedAt)}</span>
                    </div>
                    <Badge label="In Progress" bg="bg-amber-100" color="text-amber-800" />
                  </div>
                ))}
                {member.submissions.length === 0 && member.drafts.length === 0 && (
                  <div className="p-[20px] text-center style-caption text-ink-muted">No applications or active drafts.</div>
                )}
              </div>
            </div>

            {/* Application Reviews Conducted */}
            {member.reviews.length > 0 && (
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                <div className="border-b border-table-line p-[20px]">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Application Reviews Conducted</h2>
                </div>
                <div className="flex flex-col">
                  {member.reviews.map((rev) => (
                    <div key={rev.id} className="flex items-center justify-between border-b border-table-line last:border-0 p-[20px]">
                      <div className="flex flex-col gap-[4px]">
                        <span className="style-body-text text-ink">
                          Reviewed {rev.submission.user.profile?.firstName} {rev.submission.user.profile?.lastName}
                        </span>
                        {rev.notesInternal && <span className="style-caption text-ink-muted italic">&quot;{rev.notesInternal}&quot;</span>}
                      </div>
                      <Badge label={rev.status.replace(/_/g, " ")} bg="bg-purple-50" color="text-purple-700" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Created Application Forms */}
            {member.createdApps.length > 0 && (
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                <div className="border-b border-table-line p-[20px]">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Created Application Forms</h2>
                </div>
                <div className="flex flex-col">
                  {member.createdApps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between border-b border-table-line last:border-0 p-[20px]">
                      <div className="flex flex-col gap-[4px]">
                        <span className="style-body-text text-ink">{app.title}</span>
                        <span className="style-caption text-ink-faint">
                          Closes {DATE_FORMAT.format(app.closeAt)}
                        </span>
                      </div>
                      <Badge label={app.programType} bg="bg-blue-50" color="text-blue-700" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events Organized */}
            {member.createdEvents.length > 0 && (
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                <div className="flex items-center justify-between border-b border-table-line p-[20px]">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Events Organized</h2>
                  <span className="style-caption text-brand">{member.createdEvents.length} Total</span>
                </div>
                <div className="flex flex-col">
                  {member.createdEvents.map((evt) => (
                    <div key={evt.id} className="flex items-center justify-between p-[20px] border-b border-table-line last:border-0 hover:bg-row-soft transition-colors">
                      <div className="flex flex-col gap-[4px]">
                        <span className="style-body-text text-ink">{evt.title}</span>
                        <span className="style-caption text-ink-faint">{TIME_FORMAT.format(evt.startTime)}</span>
                      </div>
                      <Badge label={evt.status} bg="bg-gray-100" color="text-gray-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Item Scans Performed */}
            {member.itemScans.length > 0 && (
              <div className="flex flex-col rounded-[14px] border border-border-soft bg-white">
                <div className="border-b border-table-line p-[20px]">
                  <h2 className="font-techno uppercase tracking-[1px] text-ink-faint">Logistics Scans Performed</h2>
                </div>
                <div className="flex flex-col p-[20px] gap-[12px]">
                  {member.itemScans.map((scan) => (
                    <div key={scan.id} className="flex justify-between items-center">
                      <span className="style-body-text text-ink">Scanned: {scan.eventItem.name}</span>
                      <span className="style-caption text-ink-faint">{TIME_FORMAT.format(scan.scannedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Layout Components ---
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-[16px]">
      <span className="style-caption text-ink-faint shrink-0">{label}</span>
      <span className="style-body-text font-medium text-ink text-right truncate">
        {formatDisplayString(value)}
      </span>
    </div>
  );
}

function LinkRow({ label, url }: { label: string; url?: string | null }) {
  if (!url) {
    return (
      <div className="flex items-center justify-between">
        <span className="style-caption text-ink-faint">{label}</span>
        <span className="style-body-text text-ink-faint">—</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="style-caption text-ink-faint">{label}</span>
      <a href={url} target="_blank" rel="noreferrer" className="style-body-text text-brand hover:underline font-medium truncate max-w-[200px]">
        {url.replace(/^https?:\/\/(www\.)?/, "")} ↗
      </a>
    </div>
  );
}