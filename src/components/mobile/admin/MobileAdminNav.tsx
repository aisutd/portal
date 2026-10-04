import Link from "next/link";
import { cn } from "@/lib/utils";
import { type AdminViewer, adminRoleLabel, getAdminViewer } from "@/lib/admin-access";

type MobileAdminNavLabel =
  | "Applications"
  | "Events"
  | "Academy"
  | "AIM"
  | "Members"
  | "Exit Admin";

/** Mirrors the desktop sidebar: each section declares who may see it. */
const NAV_ITEMS: readonly {
  label: MobileAdminNavLabel;
  href: string;
  visible: (viewer: AdminViewer | null) => boolean;
}[] = [
  { label: "Applications", href: "/admin/applications", visible: (v) => !!v?.canReview },
  { label: "Events", href: "/admin/events", visible: (v) => !!v?.isAdmin },
  { label: "Academy", href: "/admin/academy", visible: (v) => !!v?.canManageAcademy },
  { label: "AIM", href: "/admin/aim", visible: (v) => !!v?.canManageAim },
  { label: "Members", href: "/admin/members", visible: (v) => !!v?.isAdmin },
  { label: "Exit Admin", href: "/dashboard", visible: () => true },
];

type MobileAdminNavProps = {
  active?: MobileAdminNavLabel;
};

/** Compact top nav replacing the desktop admin sidebar on narrow screens. */
export async function MobileAdminNav({ active = "Events" }: MobileAdminNavProps) {
  const viewer = await getAdminViewer();

  // Reviewers see their program, not "Member" — the role they hold is not the
  // reason they are here.
  const role = adminRoleLabel(viewer);
  const navItems = NAV_ITEMS.filter((item) => item.visible(viewer));

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
        {navItems.map((item) => {
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
