import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileEyebrow } from "@/components/mobile/ui/MobileEyebrow";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import {
  upNextTags,
  applications,
  rsvps,
  achievements,
  recommended,
  announcements,
} from "@/lib/data";

function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-mobile-display text-[17px] font-bold text-ink">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function MobileDashboard() {
  return (
    <MobileScreen>
      <div className="flex flex-col gap-[8px]">
        <h1 className="font-mobile-display text-[24px] font-bold text-brand">
          Welcome back, Member! :)
        </h1>
        <Badge
          label="2 new announcements!"
          bg="#fbe3cb"
          color="#7a4416"
          className="self-start"
        />
      </div>

      {/* Up Next */}
      <Card className="flex flex-col gap-[14px] p-[18px]">
        <MobileEyebrow>Up Next · in 3 days</MobileEyebrow>
        <div className="flex items-start gap-[14px]">
          <div className="size-[72px] shrink-0 rounded-[12px] bg-photo" />
          <div className="flex min-w-px flex-1 flex-col gap-[2px]">
            <h3 className="font-mobile-display text-[17px] font-bold text-ink">
              Fall Kickoff
            </h3>
            <p className="font-mobile-body text-[13px] text-ink-muted">
              Aug 27, 2026 · 7:00 PM
            </p>
            <p className="font-mobile-body text-[13px] text-ink-muted">
              ECSW 1.315
            </p>
          </div>
          <div className="size-[44px] shrink-0 rounded-[8px] border border-ink bg-white" />
        </div>
        <div className="flex gap-[8px]">
          {upNextTags.map((t) => (
            <Tag key={t.label} {...t} />
          ))}
        </div>
        <Button variant="primary" size="sm" block>
          Add to Calendar
        </Button>
      </Card>

      {/* RSVPs + CTA */}
      <Card className="flex flex-col gap-[12px] p-[18px]">
        <SectionTitle>Your RSVPs</SectionTitle>
        {rsvps.map((r) => (
          <div key={r.title} className="flex items-center gap-[10px]">
            <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-brand-soft">
              <span className="font-mobile-body text-[11px] font-bold text-brand-dark">
                {r.day}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mobile-body text-[13px] font-bold text-ink">
                {r.title}
              </span>
              <span className="font-mono text-[11px] text-ink-faint">
                {r.detail}
              </span>
            </div>
          </div>
        ))}
      </Card>

      <Card className="flex flex-col items-start gap-[14px] !bg-brand p-[18px]">
        <h2 className="font-mobile-display text-[17px] font-bold leading-[22px] text-white">
          Nothing on your calendar this week?
        </h2>
        <Link href="/events/browse" className="w-full">
          <Button variant="accent" size="sm" block>
            Browse Events →
          </Button>
        </Link>
      </Card>

      {/* Applications */}
      <Card className="flex flex-col gap-[16px] p-[18px]">
        <SectionTitle
          action={
            <a href="#" className="font-mono text-[11px] text-brand">
              View all
            </a>
          }
        >
          Your Applications
        </SectionTitle>
        {applications.map((a) => (
          <div key={a.title} className="flex flex-col gap-[8px]">
            <div className="flex items-center justify-between gap-[8px]">
              <span className="font-mobile-body text-[13px] font-bold text-ink">
                {a.title}
              </span>
              {a.status.variant === "outline" ? (
                <Badge variant="outline" label={a.status.label} />
              ) : (
                <Badge
                  variant="solid"
                  label={a.status.label}
                  bg={a.status.bg}
                  color={a.status.color}
                />
              )}
            </div>
            <ProgressBar
              value={a.percent}
              trackColor="#e1e8ff"
              fillColor={a.fillColor}
              height={7}
            />
          </div>
        ))}
      </Card>

      {/* Recommended */}
      <Card className="flex flex-col gap-[12px] p-[18px]">
        <SectionTitle
          action={
            <a href="#" className="font-mono text-[11px] text-brand">
              Refresh
            </a>
          }
        >
          Recommended for you
        </SectionTitle>
        {recommended.map((r) => (
          <div
            key={r.title}
            className="flex items-center justify-between gap-[10px] rounded-[12px] bg-row-soft p-[12px]"
          >
            <div className="flex min-w-px items-center gap-[10px]">
              <div className="size-[44px] shrink-0 rounded-[10px] bg-photo" />
              <div className="flex flex-col">
                <span className="font-mobile-body text-[13px] font-bold text-ink">
                  {r.title}
                </span>
                <div className="flex flex-wrap gap-[6px] pt-[2px]">
                  {r.tags.map((t) => (
                    <Tag key={t.label} {...t} />
                  ))}
                </div>
              </div>
            </div>
            <Button variant="primary" size="sm">
              RSVP
            </Button>
          </div>
        ))}
      </Card>

      {/* Achievements */}
      <Card className="flex flex-col gap-[14px] p-[18px]">
        <SectionTitle>Your Achievements</SectionTitle>
        <div className="flex gap-[10px]">
          {achievements.map((a) => (
            <div
              key={a.label}
              className="flex flex-1 flex-col items-center gap-[6px] rounded-[12px] p-[14px]"
              style={{ backgroundColor: a.bg }}
            >
              <span
                className="font-mobile-display text-[22px] font-bold"
                style={{ color: a.color }}
              >
                {a.value}
              </span>
              <span
                className="text-center font-mobile-body text-[10px] font-bold uppercase tracking-[0.5px]"
                style={{ color: a.color }}
              >
                {a.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Announcements */}
      <Card className="flex flex-col gap-[10px] !bg-orange-soft p-[18px]">
        <SectionTitle action={<Badge label="2 new" bg="#fbe3cb" color="#7a4416" />}>
          <span className="text-orange-ink">Announcements</span>
        </SectionTitle>
        {announcements.map((a, i) => (
          <div
            key={a.title}
            className={
              i > 0
                ? "flex flex-col gap-[2px] border-t border-[#eecaa6] pt-[10px]"
                : "flex flex-col gap-[2px]"
            }
          >
            <p className="font-mobile-body text-[13px] font-bold text-orange-ink">
              {a.title}
            </p>
            <p className="font-mobile-body text-[12px] text-orange-ink">
              {a.body}
            </p>
          </div>
        ))}
      </Card>

      <BottomNav />
    </MobileScreen>
  );
}
