"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const ADMIN_ROLES = ["REVIEWER", "ORGANIZER", "SUPER_ADMIN"] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // 1. Initialize state instantly using metadata if it exists
  const metadataRole = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const [role, setRole] = useState<string | null>(metadataRole || null);

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

  const isAdmin = !!role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);

  // 3. Base navigation array
  const tabs = [
    { label: "Events", href: "/events" },
    { label: "Apply", href: "/applications" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  // 4. Inject Admin route if permissions pass
  if (isSignedIn && isAdmin) {
    tabs.push({ label: "Admin", href: "/admin/dashboard" });
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 md:hidden">
      <div className="flex w-full items-center justify-center border-t border-border-soft bg-white px-4 py-2.5 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex w-full max-w-[340px] items-center justify-between gap-1">
          {tabs.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full px-3.5 py-1.5 style-nav-link text-[13.5px] transition-colors ${
                  active ? "bg-purple-soft text-brand" : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
          <Link
            href="/profile"
            aria-label="Profile"
            className={`size-[30px] shrink-0 rounded-full border-2 bg-photo transition-colors ${
              pathname?.startsWith("/profile") ? "border-brand" : "border-card-border"
            }`}
          />
        </div>
      </div>
    </nav>
  );
}
