"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import Link from "next/link";
import QRCode from "react-qr-code";
import { EventCoverImage } from "../events/event-cover-image";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

export type TagData = {
  label: string;
  bg: string;
  color: string;
  border?: string;
};

type CalendarLinksObject = {
  googleUrl: string;
  outlookUrl: string;
  icsContent: string;
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
  calendarLinks?: CalendarLinksObject | null;
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
  calendarLinks = null,
}: UpNextProps) {  
  const eventLink = eventId ? `/events/${eventId}` : "/events";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const googleUrl = calendarLinks?.googleUrl || "";
  const icsContent = calendarLinks?.icsContent || "";

  // Prevent SSR hydration mismatch for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update absolute position of portal dropdown on open/resize/scroll
  useEffect(() => {
    if (!dropdownOpen) return;

    function updatePosition() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }

    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Compiles and downloads the .ics file directly on the client browser
  const handleIcsDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!icsContent) return;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `event-${eventId || "invite"}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDropdownOpen(false);
  };

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
          "absolute inset-x-0 top-0 h-[4px] rounded-t-2xl transition-colors duration-300",
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
            Ticket: Claiming Items / Late Check-in
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
        <div className="flex flex-wrap items-start gap-6">
          {/* Linked Event Content */}
          <Link
            href={eventLink}
            className="group flex flex-1 flex-wrap items-start gap-[24px] min-w-0"
          >
            {/* Photo */}
            <EventCoverImage
              className="flex h-68 w-auto min-w-75 max-w-90 shrink-0 items-center justify-center rounded-xl group-hover:opacity-90 transition-opacity"
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

            {/* Calendar Dropdown Trigger */}
            {!isLive && calendarLinks && (
              <div className="pt-0.5 w-full relative" ref={buttonRef}>
                <Button 
                  onClick={() => setDropdownOpen(!dropdownOpen)} 
                  variant="primary" 
                  size="md" 
                  className="font-black w-full"
                >
                  Add to Calendar
                </Button>

                {/* Dropdown Options List Portaled to Document Body */}
                {dropdownOpen && mounted && createPortal(
                  <div
                    ref={menuRef}
                    style={{
                      position: "absolute",
                      top: `${coords.top}px`,
                      left: `${coords.left}px`,
                      width: `${coords.width}px`,
                    }}
                    className="rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-9999 overflow-hidden"
                  >
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      {googleUrl && (
                        <a
                          href={googleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Google Calendar
                        </a>
                      )}
                      {icsContent && (
                        <button
                          onClick={handleIcsDownload}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100 transition-colors"
                          role="menuitem"
                        >
                          Apple / Device Calendar (.ics)
                        </button>
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}