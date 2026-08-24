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
  return (
    <Card
      className={cn(
        "flex flex-1 flex-col gap-[18px] self-stretch p-[29px] transition-all duration-300",
        (isGlowing || isLive) &&
          "border-green bg-checked/20 shadow-[0_0_20px_rgba(53,107,46,0.35)] ring-1 ring-green/50"
      )}
    >
      {/* Header Row: Keeps the eyebrow and QR caption at the exact same height */}
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
          <h2 className="style-card-title  text-ink">{title || "No RSVPs yet"}</h2>
          <p className="style-body-text  text-ink-muted text-center max-w-[280px] leading-tight">
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
          {/* Photo */}
          <EventCoverImage className="flex h-55 w-75 max-w-75 shrink-0 items-center justify-center rounded-xl"
            imageUrl={imageUrl} />

          {/* Details */}
          <div className="flex min-w-px flex-1 flex-col justify-center gap-[10px] self-stretch">
            <h3 className="style-card-title wrap-break-word leading-[34.56px] tracking-[-0.4px] text-ink">
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

            {!isLive && (
              <div className="pt-[6px]">
                <Button variant="primary" size="md" className="font-black">
                  Add to Calendar
                </Button>
              </div>
            )}
          </div>

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
        </div>
      )}
    </Card>
  );
}