import type { MembershipType, UserRole, TEAM } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { MemberRolesEditor } from "@/components/admin/member-roles-editor";
import { MemberStatusPopover } from "@/components/admin/member-status-popover";
import type { StatusKey } from "@/lib/members/badges";
import Link from "next/link";

export type MemberBadge = {
  label: string;
  bg?: string;
  color?: string;
  outline?: boolean;
};

export type Member = {
  /** User.id — the row key. NetID is nullable and cannot be used. */
  id: string;
  name: string;
  netid: string;
  /** Permission badge then program badges. Never empty. */
  roles: MemberBadge[];
  /** Raw values, for the editor to seed its form. */
  userRole: UserRole;
  team?: TEAM | null;
  programs: MembershipType[];
  events: string;
  joined: string;
  status: MemberBadge;
  /** Everything behind the status badge, for the explain popover. */
  statusDetail: MemberStatusDetail;
};

export type MemberStatusEvent = {
  id: string;
  title: string;
  date: string;
  /** Untagged events count toward every member. */
  general: boolean;
  attended: boolean;
};

export type MemberStatusDetail = {
  statusKey: StatusKey;
  attended: number;
  countable: number;
  /** Further events needed to reach Active. */
  needed: number;
  programs: MembershipType[];
  events: MemberStatusEvent[];
};

// Shared 7-column template so the header and every row align exactly.
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

/**
 * The members directory table: a tinted header row and one row per member,
 * each with avatar, identity, role/status pills, and a row menu.
 */
export function MembersTable({
  members,
  canManageRoles = false,
}: {
  members: Member[];
  /** Executives get an editable row menu; everyone else gets an inert one. */
  canManageRoles?: boolean;
}) {
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
      {members.map((m, i) => (
        <div
          key={m.id}
          className={`${GRID} min-h-[65px] items-center py-[10px] transition-colors hover:bg-row-soft/60 ${
            i < members.length - 1 ? "border-b border-table-line" : "rounded-b-[14px]"
          }`}
        >
          {/* Name & Identity Direct Link */}
          <Link
            href={`/admin/members/${m.id}`}
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
      ))}
    </div>
  );
}