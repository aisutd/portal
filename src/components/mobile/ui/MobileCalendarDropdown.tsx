"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

type CalendarLinksObject = {
  googleUrl: string;
  outlookUrl: string;
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="w-full relative mt-2" ref={dropdownRef}>
      <Button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        variant="primary"
        size="sm"
        className="font-black w-full"
      >
        Add to Calendar
      </Button>

      {dropdownOpen && (
        <div className="absolute left-0 right-0 mt-2 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
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
            {calendarLinks.outlookUrl && (
              <a
                href={calendarLinks.outlookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-sm text-gray-700 active:bg-gray-100 border-b border-gray-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Outlook Web
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
        </div>
      )}
    </div>
  );
}
