"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import Link from "next/link";
import QRCode from "react-qr-code";

export type TagData = {
  label: string;
  bg: string;
  color: string;
  border?: string;
};

type UpNextProps = {
  eyebrow: string;
  title: string;
  dateLines: string[];
  tags?: TagData[];
  isEmpty?: boolean;
  qrToken?: string;
  isLive?: boolean;
};

export function UpNextCard({ eyebrow, title, dateLines, tags = [], isEmpty = false, qrToken, isLive = false}: UpNextProps) {
  return (
    <Card className="flex flex-1 flex-col gap-[18px] self-stretch p-[29px]">
      <p className="style-meta-text text-[12px] uppercase leading-[normal] tracking-[3px] text-ink-faint">
        {eyebrow}
      </p>

      {isEmpty ? (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-[8px] rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6] h-[170px] p-[12px]">
          <div className="flex size-[40px] items-center justify-center rounded-full bg-[#eef2ff]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f5fe8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h2 className="style-card-title text-[16px] text-ink">{title || "No RSVPs yet"}</h2>
          <p className="style-body-text text-[13px] text-ink-muted text-center max-w-[280px] leading-tight">
            {dateLines[0] || "You haven't saved any events. Browse what's coming up this semester."}
          </p>
          <Link href="/events" className="mt-[2px]">
            <Button variant="primary" size="sm" pill className="px-[20px]">
              Browse Events →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-[24px]">
          {/* Photo placeholder */}
          <div className="flex h-[170px] w-[240px] shrink-0 items-center justify-center rounded-xl bg-photo">
            <span className="style-meta-text text-[11px] tracking-[1.5px] text-photo-text">
              PHOTO
            </span>
          </div>

          {/* Details */}
          <div className="flex min-w-px flex-1 flex-col justify-center gap-[10px] self-stretch">
            <h3 className="style-card-title text-[32px] leading-[34.56px] tracking-[-0.4px] text-ink">
              {title}
            </h3>

            <p className="style-body-text text-[14px] leading-[20.3px] text-ink-muted">
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
          <div className="flex size-50 shrink-0 items-center justify-center rounded-[10px] border border-ink bg-white p-[8px]">
            {qrToken ? (
              <QRCode value={qrToken} size={200} level="H" />
            ) : (
              <span className="font-mono text-[11px] uppercase tracking-[1.5px] text-ink-faint">
                QR
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
