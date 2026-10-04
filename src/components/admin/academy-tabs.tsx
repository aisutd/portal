import Link from "next/link";

const TABS = [
  { label: "Workshops", href: "/admin/academy/workshops" },
  { label: "Resources", href: "/admin/academy/resources" },
  { label: "Members", href: "/admin/academy/members" },
] as const;

export type AcademyTab = (typeof TABS)[number]["label"];

/** Secondary nav within the Academy admin area. */
export function AcademyTabs({ active }: { active: AcademyTab }) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto border-b border-border-soft pb-3 scrollbar-none">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.label === active ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 style-caption font-semibold transition-colors ${
            tab.label === active
              ? "bg-brand/10 text-brand"
              : "text-ink-muted hover:bg-row-soft hover:text-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
