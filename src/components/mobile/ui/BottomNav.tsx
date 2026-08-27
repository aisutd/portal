"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { isAdminRole, isKnownRole } from "@/lib/roles";
import { Show, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // 1. Initialize state instantly using metadata if it exists
  const rawMetadataRole = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const metadataRole = isKnownRole(rawMetadataRole) ? rawMetadataRole : undefined;
  const [role, setRole] = useState<string | null>(metadataRole ?? null);

  // 2. Fetch fallback logic identical to the desktop navbar
  useEffect(() => {
    if (!isSignedIn) {
      setRole(null);
      return;
    }

    if (metadataRole) {
      setRole(metadataRole);
      return;
    }

    let isMounted = true;
    async function loadRole() {
      try {
        const response = await fetch("/api/me");
        if (!isMounted) return;
        if (!response.ok) {
          setRole(null);
          return;
        }
        const data = await response.json();
        setRole(data?.role ?? null);
      } catch {
        if (isMounted) setRole(null);
      }
    }

    loadRole();
    return () => {
      isMounted = false;
    };
  }, [isSignedIn, metadataRole]);

  const isAdmin = isAdminRole(role);

  // 3. Base navigation array
  const tabs = [
    { label: "Events", href: "/events" },
    { label: "Apply", href: "/applications" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  // 4. Inject Admin route if permissions pass
  if (isSignedIn && isAdmin) {
    tabs.push({ label: "Admin", href: "/admin/events" });
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
                className={`rounded-full px-3 py-2 style-nav-link transition-colors whitespace-nowrap ${
                  active ? "bg-purple-soft text-brand" : "text-ink-muted hover:text-ink"
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
              className="rounded-full bg-brand px-3 py-2 style-nav-link text-white whitespace-nowrap shrink-0"
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