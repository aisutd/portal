"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";

export function MobileOnboarding() {
  const [tab, setTab] = useState("Sign up");

  return (
    <div className="flex min-h-screen flex-col bg-cream font-mobile-body text-ink">
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col">
        {/* Cream header */}
        <div className="flex flex-col gap-[12px] px-[24px] pb-[90px] pt-[32px]">
          <p className="font-mobile-display text-[12px] font-bold uppercase tracking-[1.5px] text-brand">
            Artificial Intelligence Society
          </p>
          <h1 className="font-mobile-display text-[26px] font-bold leading-[32px] text-ink">
            Step into the world of{" "}
            <span className="text-brand">artificial intelligence</span>
          </h1>
        </div>

        {/* Blue lower panel with overlapping card */}
        <div className="flex flex-1 flex-col items-center gap-[24px] bg-brand px-[20px] pb-[40px] pt-[36px]">
          <div className="-mt-[76px] w-full rounded-[16px] bg-white p-[24px] shadow-auth-card">
            <SegmentedTabs
              options={["Sign up", "Log in"]}
              value={tab}
              onChange={setTab}
            />

            <h2 className="mt-[20px] font-mobile-display text-[19px] font-bold text-ink-card">
              Create your account
            </h2>

            <div className="mt-[16px] flex flex-col gap-[14px]">
              <Field
                label="UTD Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="netid@utdallas.edu"
              />
              <Field
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </div>

            <div className="mt-[18px]">
              <Button variant="auth" block>
                View Dashboard ↗
              </Button>
            </div>

            <p className="mt-[12px] text-center font-mono-alt text-[11px] text-helper-ink">
              we&apos;ll send a link to validate your email
            </p>
          </div>

          <Button variant="accent" size="lg">
            Join Discord ↗
          </Button>
        </div>
      </div>
    </div>
  );
}
