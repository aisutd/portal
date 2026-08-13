import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { MobileMembersToolbar } from "@/components/mobile/admin/MobileMembersToolbar";
import { MembersPagination } from "@/components/admin/members-pagination";
import type { MemberBadge } from "@/components/admin/members-table";
import type { MembersQuery } from "@/lib/members/query-params";
import type { MembersViewModel } from "@/lib/members/view-model";

function RoleStatus({ badge }: { badge: MemberBadge }) {
  return badge.outline ? (
    <Badge label={badge.label} variant="outline" />
  ) : (
    <Badge label={badge.label} bg={badge.bg} color={badge.color} />
  );
}

export function MobileAdminMembers({
  query,
  view,
}: {
  query: MembersQuery;
  view: MembersViewModel;
}) {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Members" />

      <div className="flex items-center justify-between gap-[8px]">
        <h2 className="font-mobile-display text-[20px] font-bold text-ink">Members</h2>
        <div className="flex gap-[8px]">
          <Button variant="ghost" size="sm">Export CSV</Button>
          <Button variant="primary" size="sm">+ Invite</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[12px]">
        {view.stats.map((s) => (
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

      <MobileMembersToolbar query={query} />

      {view.rows.length > 0 ? (
        <div className="flex flex-col gap-[10px]">
          {view.rows.map((m) => (
            <div
              key={m.id}
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
      ) : (
        <div className="w-full rounded-[16px] border border-border-soft bg-white px-[16px] py-[28px] text-center font-mobile-body text-[14px] text-ink-muted">
          No members match this search.
        </div>
      )}

      <MembersPagination
        query={query}
        page={view.page}
        pageCount={view.pageCount}
        rangeStart={view.rangeStart}
        rangeEnd={view.rangeEnd}
        total={view.total}
      />
    </MobileScreen>
  );
}
