import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { StatCard } from "@/components/admin/stat-card";
import { MembersTable } from "@/components/admin/members-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileAdminMembers } from "@/components/mobile/admin/MobileAdminMembers";
import { memberStats, memberFilters, members } from "@/lib/data";

export const metadata: Metadata = {
  title: "AIS Admin — Members",
  description: "Browse and manage AIS members.",
};

export default function AdminMembersPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileAdminMembers />
      </div>

      <div className="hidden md:block">
      <div className="flex min-h-screen w-full bg-cream">
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
            {memberStats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex w-full items-center gap-[12px]">
            <input
              type="text"
              placeholder="🔍 search name / netid / email…"
              className="h-[42px] flex-1 rounded-[8px] bg-search-field px-[14px] font-mono text-[12px] text-search-ink placeholder:text-search-ink focus:outline-none"
            />
            {memberFilters.map((f) => (
              <Button
                key={f.label}
                variant={f.active ? "soft" : "ghost"}
                size="sm"
                className="rounded-[8px]"
              >
                {f.label}
              </Button>
            ))}
            <Badge label="sort: A–Z" variant="outline" />
          </div>

          {/* Table */}
          <MembersTable members={members} />

          {/* Footer / pagination */}
          <div className="flex w-full items-center justify-between">
            <span className="font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-ink-faint">
              Showing 1–8 of 109
            </span>
            <div className="flex items-center gap-[8px]">
              <Button variant="ghost" size="sm" className="rounded-[8px]">
                ‹ Prev
              </Button>
              <Badge label="1" bg="#e1e8ff" color="#1f3aa3" />
              <Badge label="2" variant="outline" />
              <Badge label="3" variant="outline" />
              <Button variant="ghost" size="sm" className="rounded-[8px]">
                Next ›
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
