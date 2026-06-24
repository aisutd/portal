import Link from "next/link";

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Events", href: "/events" },
  { label: "Apply", href: "/applications" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function TopNav({ active = "Events" }: { active?: string }) {
  return (
    <header className="flex h-[72px] w-full items-center gap-[22px] border-b border-line bg-white px-5 sm:px-[38px]">
      {/* Brand */}
      <Link
        href="/events"
        className="shrink-0 rounded-[10px] border border-ais-blue px-[15px] py-[9px]"
      >
        <span className="font-display text-[16px] tracking-[1px] text-ais-blue">
          AIS
        </span>
      </Link>

      {/* Center nav */}
      <nav className="flex flex-1 items-center justify-center gap-6 sm:gap-[50px]">
        {NAV.map((item) => {
          const isActive = item.label === active;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative px-[2px] py-[6px]"
            >
              <span
                className={`font-nav text-[15px] tracking-[0.5px] sm:text-[16px] ${
                  isActive ? "text-ais-blue" : "text-slate"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-[6px] left-0 right-0 h-[2.5px] rounded-[2px] bg-ais-blue" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Member */}
      <div className="flex shrink-0 items-center gap-[11px] border-l border-line pl-[25px]">
        <span className="size-8 shrink-0 rounded-full border border-[#8a8a93]" />
        <span className="hidden font-body text-[15px] font-semibold text-slate sm:block">
          Member
        </span>
      </div>
    </header>
  );
}
