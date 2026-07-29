"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileField } from "@/components/mobile/ui/MobileField";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { MobileEyebrow as Eyebrow } from "@/components/mobile/ui/MobileEyebrow";

export function MobileProfile() {
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <MobileScreen>
      {/* Avatar + Links */}
      <div className="flex gap-[12px]">
        <Card className="flex flex-[3] flex-col items-center gap-[10px] p-[18px]">
          <div className="size-[64px] rounded-full bg-photo" />
          <p className="font-mobile-display text-[15px] font-bold uppercase tracking-[0.5px] text-ink">
            Member Name
          </p>
          <Badge label="Computer Science · Senior" bg="#fbe3cb" color="#7a4416" />
        </Card>

        <Card className="flex flex-[2] flex-col gap-[12px] p-[16px]">
          <Eyebrow>Links</Eyebrow>
          <MobileField label="LinkedIn" placeholder="linkedin.com/in/…" />
          <MobileField label="Github" placeholder="github.com/…" />
        </Card>
      </div>

      {/* Personal Info */}
      <Card className="flex flex-col gap-[14px] p-[18px]">
        <Eyebrow>Personal Info</Eyebrow>
        <MobileField label="Full Name" placeholder="Full Name" />
        <MobileField label="Email" type="email" placeholder="netid@utdallas.edu" />
        <MobileField label="UTD ID" placeholder="UTD ID" />
        <MobileField label="Major" placeholder="Major" />
        <MobileField label="Academic Year" placeholder="Academic Year" />
      </Card>

      {/* Resume Upload */}
      <Card className="flex flex-col gap-[12px] p-[18px]">
        <Eyebrow>Resume Upload</Eyebrow>
        <div className="flex items-center gap-[14px] rounded-[12px] border border-dashed border-card-border p-[14px]">
          <div className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-purple-soft">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-[18px] text-purple-ink"
            >
              <path
                d="M12 4v11m0-11 4 4m-4-4-4 4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-mobile-body text-[13px] font-bold text-ink">
              Upload New Resume
            </p>
            <p className="font-mono text-[11px] text-ink-faint">
              PDF, DOCX, UP TO 5MB.
            </p>
          </div>
          <Button variant="primary" size="sm">
            Select File
          </Button>
        </div>
      </Card>

      {/* Security */}
      <Card className="flex flex-col gap-[16px] p-[18px]">
        <Eyebrow>Security</Eyebrow>

        <div className="flex items-center justify-between gap-[12px] rounded-[12px] bg-row-soft p-[14px]">
          <div>
            <p className="font-mobile-body text-[13px] font-bold text-ink">
              Change Password
            </p>
            <p className="font-mobile-body text-[12px] text-ink-muted">
              Update your account password
            </p>
          </div>
          <Button variant="accent" size="sm">
            Reset Password
          </Button>
        </div>

        <div className="flex items-center justify-between gap-[12px] rounded-[12px] bg-row-soft p-[14px]">
          <div>
            <p className="font-mobile-body text-[13px] font-bold text-ink">
              Email Notifications
            </p>
            <p className="font-mobile-body text-[12px] text-ink-muted">
              Receive updates from AIS about events and new roles
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmailNotifications((v) => !v)}
            aria-label="Toggle email notifications"
          >
            <Toggle on={emailNotifications} label="Email notifications" />
          </button>
        </div>
      </Card>

      {/* Footer actions */}
      <div className="flex gap-[12px]">
        <Button variant="soft" className="flex-1" block>
          Cancel
        </Button>
        <Button variant="primary" className="flex-1" block>
          Apply Changes
        </Button>
      </div>

      <BottomNav />
    </MobileScreen>
  );
}
