"use client";

import { Navbar } from "@/components/navbar";
import { MobileApply } from "@/components/mobile/apply/MobileApply";

/**
 * This page intentionally uses the same live application list on every
 * breakpoint. It is backed by /api/applications, so applications created by
 * administrators appear here as soon as they are visible to users.
 */
export default function ApplyPage() {
  return (
    <div className="bg-cream md:min-h-screen">
      <div className="hidden md:block">
        <Navbar active="Apply" />
      </div>
      <MobileApply />
    </div>
  );
}
