"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import Link from "next/link";
import QRCode from "react-qr-code";
import { EventCoverImage } from "../events/event-cover-image";

export type TagData = {
  label: string;
  bg: string;
  color: string;
  border?: string;
};

type UpNextProps = {
  eventId?: string;
  eyebrow: string;
  title: string;
  imageUrl: string | null;
  dateLines: string[];
  tags?: TagData[];
  isEmpty?: boolean;
  qrToken?: string;
  isLive?: boolean;
  isGlowing?: boolean;
};

export function UpNextCard({
  eventId,
  eyebrow,
  title,
  imageUrl,
  dateLines,
  tags = [],
  isEmpty = false,
  qrToken,
  isLive = false,
  isGlowing = false,
}: UpNextProps) {
  const eventLink = eventId ? `/events/${eventId}` : "/events";

  return (
    <Card
      className={cn(
        "relative flex flex-1 flex-col gap-[18px] self-stretch overflow-hidden p-[29px] transition-all duration-300",
        (isGlowing || isLive) &&
          "border-green bg-checked/20 shadow-[0_0_20px_rgba(53,107,46,0.35)] ring-1 ring-green/50"
      )}
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-[4px] transition-colors duration-300",
          isGlowing || isLive ? "bg-green" : "bg-brand/60"
        )}
      />
      {/* Header Row */}
      <div className="flex items-baseline justify-between gap-4">
        <p className="style-meta-text uppercase leading-[normal] tracking-[3px] text-ink-faint">
          {eyebrow}
        </p>

        {!isEmpty && (
          <p className="max-w-60 style-caption text-right text-ink">
            Your Ticket: Claiming Items / Late Check-in
          </p>
        )}
      </div>

      {isEmpty ? (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-[8px] rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6] h-[170px] p-[12px]">
          <div className="flex size-[40px] items-center justify-center rounded-full bg-[#eef2ff]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f5fe8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h2 className="style-card-title text-ink">{title || "No RSVPs yet"}</h2>
          <p className="style-body-text text-ink-muted text-center max-w-[280px] leading-tight">
            {dateLines[0] || "You haven't saved any events. Browse what's coming up this semester."}
          </p>
          <Link href="/events" className="mt-[2px]">
            <Button variant="primary" size="sm" pill className="px-[20px]">
              Browse Events →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-[24px]">
          {/* Linked Event Content */}
          <Link
            href={eventLink}
            className="group flex flex-1 flex-wrap items-start gap-[24px] min-w-0"
          >
            {/* Photo */}
            <EventCoverImage
              className="flex h-55 w-75 max-w-75 shrink-0 items-center justify-center rounded-xl group-hover:opacity-90 transition-opacity"
              imageUrl={imageUrl}
            />

            {/* Details */}
            <div className="flex min-w-px flex-1 flex-col justify-center gap-[10px] self-stretch">
              <h3 className="style-card-title wrap-break-word leading-[34.56px] tracking-[-0.4px] text-ink group-hover:text-brand transition-colors">
                {title}
              </h3>

              <p className="style-body-text leading-[20.3px] text-ink-muted">
                {dateLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>

              {tags && tags.length > 0 && (
                <div className="flex gap-[8px] pt-[2px]">
                  {tags.map((tag) => (
                    <Tag key={tag.label} {...tag} />
                  ))}
                </div>
              )}
            </div>
          </Link>

          {/* Non-linked Action Items (Calendar & QR Code) */}
          <div className="flex flex-col gap-[10px] items-center">
            {/* RSVP QR code */}
            <div className="flex size-55 shrink-0 items-center justify-center rounded-[10px] border border-ink bg-white p-[8px]">
              {qrToken ? (
                <QRCode value={qrToken} size={220} level="H" />
              ) : (
                <span className="style-caption uppercase tracking-[1.5px] text-ink-faint">
                  QR
                </span>
              )}
            </div>

            {!isLive && (
              <div className="pt-[2px] w-full">
                <Button href="https://calendar.google.com/calendar/render?action=TEMPLATE&dates=20260904T000000Z%2F20260904T020000Z&details=Whether%20you%27re%20a%20newbie%20or%20looking%20to%20innovate%20in%20AI%2FML%2C%20we%27ve%20got%20a%20place%20for%20you%21%20Learn%20all%20about%20the%20programs%20and%20events%20we%20hold%20all%20throughout%20the%20year%2C%20including%20AI%20Academy%2C%20AIM%2C%20and%20AI%20Innovation%20Labs.%20Get%20an%20opportunity%20to%20network%20with%20the%20brightest%20minds%20and%20industry%20professionals%20at%20Kickoff%20and%20become%20part%20of%20the%20largest%20AI%20organization%20in%20North%20Texas.%20Oh%2C%20and%20there%27s%20free%20food...&location=ECSW%201.315&text=AIS%20Fall%20Kickoff%202026" variant="primary" size="md" className="font-black w-full">
                  Add to Calendar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}