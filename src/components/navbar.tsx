"use client";

import Link from "next/link";
import { Show, UserButton, useAuth, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useAccount } from "@/components/account-provider";
import Image from "next/image";

const NAV_ITEMS = ["Events", "Apply", "Dashboard"] as const;
const ADMIN_LABEL = "Admin" as const;
const ADMIN_ROLES = ["REVIEWER", "ORGANIZER", "SUPER_ADMIN"] as const;

const NAV_ROUTES: Record<(typeof NAV_ITEMS)[number] | typeof ADMIN_LABEL, string> = {
  Events: "/events",
  Apply: "/applications",
  Dashboard: "/dashboard",
  Admin: "/admin/events",
};

type NavbarProps = {
  /** Which primary link is highlighted. Defaults to the dashboard. */
  active?: (typeof NAV_ITEMS)[number] | "Profile" | typeof ADMIN_LABEL;
};

export function Navbar({ active = "Dashboard" }: NavbarProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  // Resolved on the server by the root layout, so the name is already in the
  // initial HTML — no post-mount fetch, no "Profile" flash.
  const account = useAccount();

  const role =
    account?.role ??
    (user?.publicMetadata as { role?: string } | undefined)?.role ??
    null;

  const showAdminLink = !!role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
  const accountLabel = account?.firstName?.trim() || user?.firstName?.trim() || "Profile";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#f0f0f0] bg-white">
      <nav className="flex h-[72px] items-center justify-between px-[38px]">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center">
          <Image 
            src="/ais_logo_black.png" 
            alt="AIS Logo" 
            width={150}               // Explicit width prevents layout shifts
            height={44}              // Matches your h-[44px] height constraint
            className="h-[44px] w-auto object-contain" 
            priority                 // Loads the logo immediately to improve LCP
          />
        </Link>


        {/* Primary links */}
        <ul className="flex items-center gap-[8px]">
          {NAV_ITEMS.map((label) => {
            const isActive = label === active;
            return (
              <li key={label}>
                <Link
                  href={
                    label === "Dashboard" && !isSignedIn
                      ? "/onboarding?mode=login"
                      : NAV_ROUTES[label]
                  }
                  className={cn(
                    "font-techno text-[15px] font-black tracking-[0.5px] px-[24px] py-[10px] rounded-full transition-colors flex items-center justify-center",
                    isActive ? "bg-[#e1e8ff] text-[#2f5fe8]" : "text-[#4b4178] hover:bg-gray-100"
                  )}
                >
                  {label}
                </Link>
              </li>
            );
          })}

          {showAdminLink ? (
            <li>
              <Link
                href={NAV_ROUTES.Admin}
                className={cn(
                  "font-techno text-[15px] font-black tracking-[0.5px] px-[24px] py-[10px] rounded-full transition-colors flex items-center justify-center",
                  active === ADMIN_LABEL ? "bg-[#e1e8ff] text-[#2f5fe8]" : "text-[#4b4178] hover:bg-gray-100"
                )}
              >
                Admin
              </Link>
            </li>
          ) : null}
        </ul>

        {/* Account */}
        <div className="flex shrink-0 items-center gap-[11px] self-stretch border-l border-border-soft pl-[25px]">
          <Show when="signed-out">
            <Link
              href="/onboarding?mode=login"
              className="font-body text-[15px] font-semibold text-ink-muted"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding?mode=signup"
              className="rounded-[10px] border border-brand bg-brand px-[15px] py-[9px] font-body text-[15px] font-semibold text-white"
            >
              Sign Up
            </Link>
          </Show>

          <Show when="signed-in">
  <Link
    href="/profile"
    className={cn(
      "flex shrink-0 items-center gap-[11px] hover:opacity-80 transition-colors px-[20px] py-[8px] rounded-full",
      active === "Profile" ? "bg-[#e1e8ff]" : ""
    )}
  >
    <div className="pointer-events-none flex items-center">
      <UserButton
        appearance={{
          elements: {
            avatarBox: cn(
              "size-[32px] rounded-full border",
              active === "Profile" ? "border-[#2f5fe8]" : "border-[#8a8a93]"
            ),
          },
        }}
      />
    </div>
    <span
      className={cn(
        "whitespace-nowrap font-body text-[15px] font-black",
        active === "Profile" ? "text-[#2f5fe8]" : "text-[#4b4178]"
      )}
    >
      {accountLabel}
    </span>
  </Link>
</Show>
        </div>
      </nav>
    </header>
  );
}