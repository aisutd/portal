import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { StatCard } from "@/components/admin/stat-card";
import { MembersTable } from "@/components/admin/members-table";
import { MembersToolbar } from "@/components/admin/members-toolbar";
import { MembersPagination } from "@/components/admin/members-pagination";
import { MobileAdminMembers } from "@/components/mobile/admin/MobileAdminMembers";
import { Button } from "@/components/ui/button";
import { parseMembersQuery } from "@/lib/members/query-params";
import { getMembersViewModel } from "@/lib/members/view-model";

export const metadata: Metadata = {
  title: "AIS Admin — Members",
  description: "Browse and manage AIS members.",
};

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = parseMembersQuery(await searchParams);
  const view = await getMembersViewModel(query);

  return (
    <>
      <div className="md:hidden">
        <MobileAdminMembers query={query} view={view} />
      </div>

      <div className="hidden min-h-screen w-full bg-cream md:flex">
      <AdminSidebar active="Members" role="Officer" />

      <div className="flex h-full flex-1 flex-col gap-[20px] p-[46px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[32px] font-bold leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
            Members
          </h2>
          <div className="flex gap-[10px]">
            <Button variant="ghost" size="md">
              Export CSV
            </Button>
            <Button variant="primary" size="md">
              + Invite
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="flex w-full gap-[16px]">
          {view.stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Toolbar */}
        <MembersToolbar query={query} />

        {/* Table */}
        {view.rows.length > 0 ? (
          <MembersTable members={view.rows} />
        ) : (
          <div className="w-full rounded-[14px] border border-border-soft bg-white px-[22px] py-[40px] text-center font-body text-[15px] text-ink-muted">
            No members match this search.
          </div>
        )}

        {/* Footer / pagination */}
        <MembersPagination
          query={query}
          page={view.page}
          pageCount={view.pageCount}
          rangeStart={view.rangeStart}
          rangeEnd={view.rangeEnd}
          total={view.total}
        />
      </div>
      </div>
    </>
  );
}
