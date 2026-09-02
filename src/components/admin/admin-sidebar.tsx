import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAuthenticatedUser } from "@/lib/auth";
import { Button } from "../ui/button";

const NAV_ITEMS = ["Applications", "Events", "Members", "Exit"] as const;

const NAV_ROUTES: Record<(typeof NAV_ITEMS)[number], string> = {
  Applications: "/admin/applications",
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
export async function AdminSidebar({
  active = "Applications",
}: AdminSidebarProps) {
  
  const user = await getAuthenticatedUser();
  // Format role nicely (e.g., fallback to "Officer" or capitalize if it's "ADMIN", "OFFICER", etc.)
  const rawRole = user?.role || "Officer";
  const displayRole = (rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase());
  
  const fname = user?.profile?.firstName;
  const lname = user?.profile?.lastName;
  return (
    <aside className="flex min-h-screen w-[248px] shrink-0 flex-col border-r border-border-soft bg-white px-[24px] pb-[30px] pt-[30px]">
      <div className="flex flex-col gap-2">
      <h1 className="style-section-header leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]">
        AIS Admin
      </h1>
      <span className="rounded-full bg-brand-soft w-fit px-[8px] py-[2px] style-caption font-bold uppercase tracking-[0.5px] text-brand">
        {displayRole}
      </span>
      </div>

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

      <div className="flex flex-col mt-auto gap-2">
        <Button type="button" href="/profile" variant="outline" className="text-left style-caption uppercase tracking-[0.5px]">
          {fname} {lname}
        </Button>
      </div>
    </aside>
  );
}
