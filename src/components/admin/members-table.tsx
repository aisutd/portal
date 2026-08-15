import { Badge } from "@/components/ui/badge";

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
  role: MemberBadge;
  events: string;
  joined: string;
  status: MemberBadge;
};

// Shared 7-column template so the header and every row align exactly.
const GRID =
  "grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_40px] gap-x-[16px] px-[22px]";

const HEADERS = ["Name", "NetID", "Role", "Events", "Joined", "Status", ""];

function RoleStatus({ badge }: { badge: MemberBadge }) {
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
export function MembersTable({ members }: { members: Member[] }) {
  return (
    <div className="w-full overflow-hidden rounded-[14px] border border-border-soft bg-white">
      {/* Header */}
      <div
        className={`${GRID} items-center border-b border-table-line bg-row-soft py-[13px]`}
      >
        {HEADERS.map((h, i) => (
          <span
            key={i}
            className="font-techno text-[12px] uppercase tracking-[1px] text-ink-faint"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {members.map((m, i) => (
        <div
          key={m.id}
          className={`${GRID} h-[65px] items-center ${
            i < members.length - 1 ? "border-b border-table-line" : ""
          }`}
        >
          {/* Name */}
          <div className="flex items-center gap-[12px]">
            <span className="size-[34px] shrink-0 rounded-full border border-border-soft bg-photo" />
            <span className="truncate font-body text-[15px] font-bold leading-[22.5px] text-ink">
              {m.name}
            </span>
          </div>
          {/* NetID */}
          <span className="font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-ink-faint">
            {m.netid}
          </span>
          {/* Role */}
          <div>
            <RoleStatus badge={m.role} />
          </div>
          {/* Events */}
          <span className="font-body text-[14px] font-normal leading-[20.3px] text-ink-muted">
            {m.events}
          </span>
          {/* Joined */}
          <span className="font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-ink-faint">
            {m.joined}
          </span>
          {/* Status */}
          <div>
            <RoleStatus badge={m.status} />
          </div>
          {/* Menu */}
          <button
            type="button"
            aria-label={`Actions for ${m.name}`}
            className="text-left text-[16px] leading-none text-ink-faint"
          >
            ⋯
          </button>
        </div>
      ))}
    </div>
  );
}
