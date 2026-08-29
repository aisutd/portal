import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAuthenticatedUser } from "@/lib/auth";

const NAV_ITEMS = [
  { label: "Applications", href: "/admin/applications" },
  { label: "Events", href: "/admin/events" },
  { label: "Members", href: "/admin/members" },
  { label: "Exit Admin", href: "/dashboard" },
] as const;

type MobileAdminNavProps = {
  active?: (typeof NAV_ITEMS)[number]["label"];
};

/** Compact top nav replacing the desktop admin sidebar on narrow screens. */
export async function MobileAdminNav({ active = "Events" }: MobileAdminNavProps) {
  // Fetch the authenticated user to determine their actual role
  const user = await getAuthenticatedUser();
  
  // Format role nicely (e.g., fallback to "Officer" or capitalize if it's "ADMIN", "OFFICER", etc.)
  const rawRole = user?.role || "Officer";
  const role = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="style-mobile-title text-ink">AIS Admin</h1>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 style-caption font-bold uppercase tracking-[0.5px] text-brand">
            {role}
          </span>
        </div>
      </div>
      <div className="-mx-[20px] flex gap-1 overflow-x-auto px-[20px] pb-[2px]">
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === active;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-[14px] py-[6px] style-mobile-body font-bold",
                isActive ? "bg-brand-soft text-brand-dark" : "text-ink-muted"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
