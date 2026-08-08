import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import type { MemberBadge } from "@/components/admin/members-table";
import { memberStats, memberFilters, members } from "@/lib/data";

function RoleStatus({ badge }: { badge: MemberBadge }) {
  return badge.outline ? (
    <Badge label={badge.label} variant="outline" />
  ) : (
    <Badge label={badge.label} bg={badge.bg} color={badge.color} />
  );
}

export function MobileAdminMembers() {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Members" />

      <div className="flex items-center justify-between">
        <h2 className="font-mobile-display text-[20px] font-bold text-ink">Members</h2>
        <Button variant="primary" size="sm">+ Invite</Button>
      </div>

      <div className="grid grid-cols-2 gap-[12px]">
        {memberStats.map((s) => (
          <div
            key={s.label}
            className={`flex flex-col gap-[4px] rounded-[14px] border bg-white px-[16px] py-[14px] ${
              s.highlight ? "border-brand" : "border-border-soft"
            }`}
          >
            <span
              className={`font-mobile-display text-[22px] font-bold ${
                s.highlight ? "text-brand" : "text-ink"
              }`}
            >
              {s.value}
            </span>
            <span className="font-mono text-[11px] text-ink-faint">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-[10px]">
        <input
          type="text"
          placeholder="🔍 search name / netid / email…"
          className="h-[40px] w-full rounded-[8px] bg-search-field px-[12px] font-mono text-[12px] text-search-ink placeholder:text-search-ink focus:outline-none"
        />
        <div className="-mx-[20px] flex items-center gap-[8px] overflow-x-auto px-[20px]">
          {memberFilters.map((f) => (
            <span key={f.label} className="shrink-0">
              <Button variant={f.active ? "soft" : "ghost"} size="sm" className="rounded-[8px]">
                {f.label}
              </Button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-[10px]">
        {members.map((m) => (
          <div
            key={m.netid}
            className="flex flex-col gap-[10px] rounded-[16px] border border-border-soft bg-white p-[16px]"
          >
            <div className="flex items-center gap-[12px]">
              <span className="size-[36px] shrink-0 rounded-full border border-border-soft bg-photo" />
              <div className="min-w-0 flex-1">
                <p className="font-mobile-body text-[14px] font-bold text-ink">{m.name}</p>
                <p className="font-mono text-[11px] text-ink-faint">{m.netid}</p>
              </div>
              <button
                type="button"
                aria-label={`Actions for ${m.name}`}
                className="text-[16px] leading-none text-ink-faint"
              >
                ⋯
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-[8px]">
              <RoleStatus badge={m.role} />
              <RoleStatus badge={m.status} />
              <span className="font-mono text-[11px] text-ink-faint">
                {m.events} events · joined {m.joined}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-ink-faint">Showing 1–8 of 109</span>
        <div className="flex items-center gap-[8px]">
          <Button variant="ghost" size="sm" className="rounded-[8px]">‹ Prev</Button>
          <Badge label="1" bg="#e1e8ff" color="#1f3aa3" />
          <Badge label="2" variant="outline" />
          <Button variant="ghost" size="sm" className="rounded-[8px]">Next ›</Button>
        </div>
      </div>
    </MobileScreen>
  );
}
