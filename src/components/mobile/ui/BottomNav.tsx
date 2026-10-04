"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { isAdminRole } from "@/lib/roles";
import { Show, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useAccount } from "@/components/account-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const account = useAccount();

  // 1. Initialize state instantly using metadata if it exists
  const role = account?.role ?? (user?.publicMetadata as { role?: string } | undefined)?.role ?? null;
  const isAdmin = role ? isAdminRole(role) : false;
  const isReviewerOnly = account?.isReviewerOnly ?? false;
  const showAcademy = account?.isAcademyParticipant ?? false;

  // 3. Base navigation array
  const tabs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Events", href: "/events" },
    { label: "Apply", href: "/applications" },
  ];

  if (isSignedIn && showAcademy) {
    tabs.push({ label: "Academy", href: "/academy" });
  }

  // 4. Inject Admin route if permissions pass
  if (isSignedIn && isAdmin) {
    tabs.push({ label: "Admin", href: "/admin/events" });
  }

  if (isSignedIn && isReviewerOnly) {
    tabs.push({ label: "Review", href: "/admin/applications" });
  }

  const isProfileActive = pathname?.startsWith("/profile");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 md:hidden">
      <div className="flex w-full items-center justify-center border-t border-border-soft bg-white px-4 py-2.5 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {/* Adjusted max-w and flex constraints for small screens */}
        <div className="flex w-full items-center justify-around overflow-x-auto scrollbar-none shrink-0 gap-1">
          {tabs.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={
                  tab.href === "/dashboard" && !isSignedIn
                    ? "/onboarding?mode=login"
                    : tab.href
                }
                className={`rounded-full px-3.5 py-1.5 style-nav-link transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-[linear-gradient(135deg,#f2a968_0%,#7d64c4_100%)] text-white font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}

          {/* Rendered when SIGNED OUT */}
          <Show when="signed-out">
            <Link
              href="/onboarding?mode=login"
              className="rounded-lg bg-[linear-gradient(135deg,#f2a968_0%,#7d64c4_60%)] px-3 py-2 style-nav-link text-white whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>
          </Show>

          {/* Rendered when SIGNED IN */}
          <Show when="signed-in">
            <Link
              href="/profile"
              aria-label="Profile"
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full transition-colors p-1",
                isProfileActive ? "bg-[#e1e8ff]" : ""
              )}
            >
              <div className="pointer-events-none flex items-center">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: cn(
                        "size-[30px] bg-brand rounded-full border-2 transition-all",
                        isProfileActive ? "border-[#2f5fe8]" : "border-[#8a8a93]"
                      ),
                    },
                  }}
                />
              </div>
            </Link>
          </Show>
        </div>
      </div>
    </nav>
  );
}