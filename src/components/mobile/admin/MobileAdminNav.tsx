import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin/dashboard" },
  { label: "Applications", href: "/admin/applications/1" },
  { label: "Events", href: "/admin/events" },
  { label: "Members", href: "/admin/members" },
  { label: "Exit Admin", href: "/dashboard"},
] as const;

type MobileAdminNavProps = {
  active?: (typeof NAV_ITEMS)[number]["label"];
  role?: string;
};

/** Compact top nav replacing the desktop admin sidebar on narrow screens. */
export function MobileAdminNav({ active = "Overview", role = "Officer" }: MobileAdminNavProps) {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center justify-between">
        <h1 className="font-mobile-display text-[16px] font-bold text-ink">AIS Admin</h1>
        <span className="font-mono text-[11px] text-ink-faint">Role: {role}</span>
      </div>
      <div className="-mx-[20px] flex gap-1 overflow-x-auto px-[20px] pb-[2px]">
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === active;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-[14px] py-[6px] font-mobile-body text-[12px] font-bold",
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
