import Link from "next/link";
import { cn } from "@/lib/utils";
import { type AdminViewer, adminRoleLabel, getAdminViewer } from "@/lib/admin-access";
import { Button } from "../ui/button";

export type AdminNavLabel = "Applications" | "Events" | "Academy" | "Members" | "Exit";

/**
 * Each section declares who may see it, so adding a capability-gated section
 * is a one-line change rather than another parallel allow-list.
 */
const NAV_ITEMS: readonly {
  label: AdminNavLabel;
  href: string;
  visible: (viewer: AdminViewer | null) => boolean;
}[] = [
  { label: "Applications", href: "/admin/applications", visible: (v) => !!v?.canReview },
  { label: "Events", href: "/admin/events", visible: (v) => !!v?.isAdmin },
  { label: "Academy", href: "/admin/academy", visible: (v) => !!v?.canManageAcademy },
  { label: "Members", href: "/admin/members", visible: (v) => !!v?.isAdmin },
  { label: "Exit", href: "/dashboard", visible: () => true },
];

type AdminSidebarProps = {
  active?: AdminNavLabel;
  role?: string;
};


/**
 * Fixed-width admin navigation rail: brand title, section links, and a
 * role footer pinned to the bottom.
 */
export async function AdminSidebar({
  active = "Applications",
}: AdminSidebarProps) {

  const viewer = await getAdminViewer();
  // Reviewers see their program, not "Member" — the role they hold is not the
  // reason they are here.
  const displayRole = adminRoleLabel(viewer);
  const navItems = NAV_ITEMS.filter((item) => item.visible(viewer));

  const fname = viewer?.firstName;
  const lname = viewer?.lastName;
  return (
    <aside className="flex min-h-screen shrink-0 flex-col border-r border-border-soft bg-cream/50 px-[24px] pb-[30px] pt-[30px]">
      <div className="flex flex-col gap-2">
      <h1 className="style-section-header leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]">
        AIS Admin
      </h1>
      <span className="rounded-full bg-brand-soft w-fit px-[8px] py-[2px] style-caption font-bold uppercase tracking-[0.5px] text-brand">
        {displayRole}
      </span>
      </div>

      <nav className="mt-[18px] flex flex-col gap-[6px]">
        {navItems.map(({ label, href }) => {
          const isActive = label === active;
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "rounded-lg px-[14px] py-[10px] style-body-text",
                isActive
                  ? "bg-brand-mid text-white"
                  : "text-ink-muted hover:bg-brand-soft"
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
