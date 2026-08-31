"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Show, UserButton, useAuth, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useAccount } from "@/components/account-provider";
import Image from "next/image";
import { isAdminRole } from "@/lib/roles";

const NAV_ITEMS = ["Events", "Apply", "Dashboard"] as const;
const ADMIN_LABEL = "Admin" as const;

const NAV_ROUTES: Record<(typeof NAV_ITEMS)[number] | typeof ADMIN_LABEL, string> = {
  Events: "/events",
  Apply: "/applications",
  Dashboard: "/dashboard",
  Admin: "/admin/events",
};

const ACTIVE_PILL_GRADIENT = "linear-gradient(135deg, #f2a968 0%, #7d64c4 100%)";

type NavbarProps = {
  /** Which primary link is highlighted. Defaults to the dashboard. */
  active?: (typeof NAV_ITEMS)[number] | "Profile" | typeof ADMIN_LABEL;
};

function ActivePill() {
  return (
    <motion.span
      layoutId="nav-active-pill"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className="absolute inset-0 -z-10 rounded-full"
      style={{ background: ACTIVE_PILL_GRADIENT }}
    />
  );
}

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

  const showAdminLink = role ? isAdminRole(role) : false;
  const accountLabel = account?.firstName?.trim() || user?.firstName?.trim() || "Profile";

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border-soft bg-white/80 shadow-md shadow-purple-400/10 backdrop-blur-md"
          : "border-b border-transparent bg-white"
      )}
    >
      <nav className="flex h-[72px] items-center justify-between px-[38px]">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center transition-transform duration-200 hover:scale-110">
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
                    "relative style-nav-link tracking-[0.5px] px-[24px] py-[10px] rounded-full transition-all duration-200 flex items-center justify-center",
                    isActive ? "text-white" : "text-ink hover:bg-gray-100 hover:scale-105"
                  )}
                >
                  {isActive && <ActivePill />}
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
                  "relative style-nav-link tracking-[0.5px] px-[24px] py-[10px] rounded-full transition-all duration-200 flex items-center justify-center",
                  active === ADMIN_LABEL ? "text-white" : "text-ink hover:bg-gray-100 hover:scale-105"
                )}
              >
                {active === ADMIN_LABEL && <ActivePill />}
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
              className="style-nav-link  text-ink-muted"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding?mode=signup"
              className="rounded-[10px] px-[15px] py-[9px] style-nav-link text-white shadow-sm transition-transform duration-200 hover:scale-105"
              style={{ background: ACTIVE_PILL_GRADIENT }}
            >
              Sign Up
            </Link>
          </Show>

          <Show when="signed-in">
            <Link
              href="/profile"
              className={cn(
                "relative flex shrink-0 items-center gap-[11px] hover:opacity-90 transition-all duration-200 px-[20px] py-[8px] rounded-full",
                active === "Profile" ? "text-white" : "hover:scale-105"
              )}
            >
              {active === "Profile" && <ActivePill />}
              <div className="pointer-events-none flex items-center">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: cn(
                        "bg-brand text-white size-[36px] rounded-full border-2",
                        active === "Profile" ? "border-white" : "border-[#8a8a93]"
                      ),
                    },
                  }}
                />
              </div>
              <span className="whitespace-nowrap style-nav-link">
                {accountLabel}
              </span>
            </Link>
          </Show>
        </div>
      </nav>
    </header>
  );
}
