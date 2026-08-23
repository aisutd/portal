import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = ["Overview", "Applications", "Events", "Members", "Exit"] as const;

const NAV_ROUTES: Record<(typeof NAV_ITEMS)[number], string> = {
  Overview: "/admin/dashboard",
  Applications: "/admin/applications/1",
  Events: "/admin/events",
  Members: "/admin/members",
  Exit: "/dashboard",
};

type AdminSidebarProps = {
  active?: (typeof NAV_ITEMS)[number];
  role?: string;
};

/**
 * Fixed-width admin navigation rail: brand title, section links, and a
 * role footer pinned to the bottom.
 */
export function AdminSidebar({
  active = "Applications",
  role = "Officer",
}: AdminSidebarProps) {
  return (
    <aside className="flex min-h-screen w-[248px] shrink-0 flex-col border-r border-border-soft bg-white px-[24px] pb-[30px] pt-[30px]">
      <h1 className="style-section-header leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]">
        AIS Admin
      </h1>

      <nav className="mt-[18px] flex flex-col gap-[6px]">
        {NAV_ITEMS.map((label) => {
          const isActive = label === active;
          return (
            <Link
              key={label}
              href={NAV_ROUTES[label]}
              className={cn(
                "rounded-[10px] px-[14px] py-[10px] style-body-text",
                isActive
                  ? "bg-brand-soft text-brand-dark"
                  : "text-ink-muted hover:bg-row-soft"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-auto style-caption font-medium leading-[16.8px] tracking-[0.2px] text-ink-faint">
        Role: {role}
      </p>
    </aside>
  );
}
