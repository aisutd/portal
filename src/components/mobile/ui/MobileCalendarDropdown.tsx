"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type CalendarLinksObject = {
  googleUrl: string;
  icsContent: string;
};

export function MobileCalendarDropdown({ 
  calendarLinks, 
  eventId 
}: { 
  calendarLinks: CalendarLinksObject; 
  eventId: string; 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Avoid SSR hydration mismatch for portal
  useEffect(() => {
    // Required to avoid rendering a document.body portal during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Recalculate menu position when opened or window resizes
  useEffect(() => {
    if (!dropdownOpen) return;

    function updatePosition() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 8, // 8px margin
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

  const handleIcsDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!calendarLinks.icsContent) return;

    const blob = new Blob([calendarLinks.icsContent], { type: "text/calendar;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `event-${eventId || "invite"}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDropdownOpen(false);
  };

  return (
    <div className="w-full relative mt-2" ref={buttonRef}>
      <Button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        variant="primary"
        size="sm"
        className="font-black w-full"
      >
        Add to Calendar
      </Button>

      {dropdownOpen && mounted && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
          }}
          className="rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-9999 overflow-hidden"
        >
          <div className="py-1">
            {calendarLinks.googleUrl && (
              <a
                href={calendarLinks.googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-sm text-gray-700 active:bg-gray-100 border-b border-gray-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Google Calendar
              </a>
            )}
            {calendarLinks.icsContent && (
              <button
                onClick={handleIcsDownload}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 active:bg-gray-100 transition-colors"
              >
                Apple / Device Calendar (.ics)
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
