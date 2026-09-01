"use client";

import type { MembershipType, UserRole, TEAM } from "@prisma/client";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MemberRolesEditor } from "@/components/admin/member-roles-editor";
import { MemberStatusPopover } from "@/components/admin/member-status-popover";
import type { StatusKey } from "@/lib/members/badges";

export type MemberBadge = {
  label: string;
  bg?: string;
  color?: string;
  outline?: boolean;
};

export type Member = {
  id: string;
  name: string;
  netid: string;
  roles: MemberBadge[];
  userRole: UserRole;
  team?: TEAM | null;
  programs: MembershipType[];
  events: string;
  joined: string;
  status: MemberBadge;
  statusDetail: MemberStatusDetail;
};

export type MemberStatusEvent = {
  id: string;
  title: string;
  date: string;
  general: boolean;
  attended: boolean;
};

export type MemberStatusDetail = {
  statusKey: StatusKey;
  attended: number;
  countable: number;
  needed: number;
  programs: MembershipType[];
  events: MemberStatusEvent[];
};

const GRID =
  "grid grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.9fr)_40px] gap-x-[16px] px-[22px]";

const HEADERS = ["Name", "NetID", "Roles", "Events", "Joined", "Status", ""];

function RoleStatus({ badge }: { badge: MemberBadge }) {
  if (!badge) return null;
  return badge.outline ? (
    <Badge label={badge.label} variant="outline" />
  ) : (
    <Badge label={badge.label} bg={badge.bg} color={badge.color} />
  );
}

export function MembersTable({
  members,
  canManageRoles = false,
}: {
  members: Member[];
  canManageRoles?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Construct current path with query string preserved (e.g. /admin/members?page=2&search=john)
  const currentQuery = searchParams.toString();
  const currentPathWithQuery = currentQuery ? `${pathname}?${currentQuery}` : pathname;

  return (
    <div className="w-full rounded-[14px] border border-border-soft bg-white">
      {/* Header */}
      <div
        className={`${GRID} items-center rounded-t-[14px] border-b border-table-line bg-row-soft py-[13px]`}
      >
        {HEADERS.map((h, i) => (
          <span
            key={i}
            className="font-techno uppercase tracking-[1px] text-ink-faint"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {members.map((m, i) => {
        // Encode full state URL into redirectUrl parameter
        const profileHref = `/admin/members/${m.id}?redirectUrl=${encodeURIComponent(
          currentPathWithQuery
        )}`;

        return (
          <div
            key={m.id}
            className={`${GRID} min-h-[65px] items-center py-[10px] transition-colors hover:bg-row-soft/60 ${
              i < members.length - 1 ? "border-b border-table-line" : "rounded-b-[14px]"
            }`}
          >
            {/* Name & Identity Direct Link */}
            <Link
              href={profileHref}
              className="group flex items-center gap-[12px] min-w-0"
            >
              <span className="size-[34px] shrink-0 rounded-full border border-border-soft bg-photo" />
              <span className="truncate style-body-text leading-[22.5px] text-ink group-hover:underline">
                {m.name}
              </span>
            </Link>

            {/* NetID */}
            <span className="style-caption leading-[16.8px] tracking-[0.2px] text-ink-faint truncate">
              {m.netid}
            </span>

            {/* Roles */}
            <div className="flex flex-wrap items-center gap-[6px]">
              {m.roles?.filter(Boolean).map((badge, idx) => (
                <RoleStatus key={badge.label ?? idx} badge={badge} />
              ))}
            </div>

            {/* Events */}
            <span className="style-body-text leading-[20.3px] text-ink-muted">
              {m.events}
            </span>

            {/* Joined */}
            <span className="style-caption leading-[16.8px] tracking-[0.2px] text-ink-faint">
              {m.joined}
            </span>

            {/* Status Popover */}
            <div>
              <MemberStatusPopover
                memberName={m.name}
                badge={m.status}
                detail={m.statusDetail}
              />
            </div>

            {/* Role Editor Menu */}
            {canManageRoles ? (
              <MemberRolesEditor
                memberId={m.id}
                memberName={m.name}
                role={m.userRole}
                team={m.team}
                programs={m.programs}
              />
            ) : (
              <span aria-hidden className="leading-none text-ink-faint text-center">
                ⋯
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}