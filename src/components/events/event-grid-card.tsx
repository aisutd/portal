"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import type { TagData } from "@/components/dashboard/up-next-card";
import { normalizeEventTags } from "@/lib/event-tags";

export type EventGridItem = {
  title: string;
  meta: string;
  description: string;
  tags: Array<string | TagData>;
  eventId: string;
  isRsvpd?: boolean;
  isPast?: boolean;
  hasAttended?: boolean;
  missedEvent?: boolean;
};

export function EventGridCard({ 
  title, 
  meta, 
  description, 
  tags, 
  eventId, 
  isRsvpd = false,
  isPast = false,
  hasAttended = false,
  missedEvent = false,
}: EventGridItem) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  
  const [hasRsvpd, setHasRsvpd] = useState(isRsvpd);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const normalizedTags = normalizeEventTags(tags);

  // Sync state if Next.js fetches new data
  useEffect(() => {
    setHasRsvpd(isRsvpd);
  }, [isRsvpd]);

  async function handleAction(e: React.MouseEvent) {
    e.preventDefault(); // Prevent triggering parent Link click
    if (!isSignedIn) {
      router.push("/onboarding?mode=login");
      return;
    }

    if (hasRsvpd) {
      const confirmCancel = window.confirm("Are you sure you want to cancel your RSVP?");
      if (!confirmCancel) return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const method = hasRsvpd ? "DELETE" : "POST";

    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, { method });
      const payload = await response.json();
      
      if (response.ok) {
        setHasRsvpd(!hasRsvpd);
        setMessage(hasRsvpd ? "RSVP canceled" : "See you there!");
        router.refresh(); 
      } else if (response.status === 409) {
        setHasRsvpd(true);
        setMessage(null);
      } else {
        setMessage(payload.error ?? "Something went wrong");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Link 
      href={`/events/${eventId}`}
      className="flex h-full flex-col rounded-2xl border border-border-soft bg-white p-5 transition-shadow hover:shadow-sm block group"
    >
      <div className="flex h-37.5 w-full shrink-0 items-center justify-center rounded-xl bg-photo overflow-hidden">
        <span className="style-caption tracking-[1.5px] text-photo-text">
          PHOTO
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <h3 className="mt-4 line-clamp-2 style-card-title leading-tight text-ink group-hover:text-brand transition-colors [font-variation-settings:'wdth'_100]">
          {title}
        </h3>
        <p className="mt-1.5 style-meta-text tracking-wide text-ink-faint">
          {meta}
        </p>
        <p className="mt-3 line-clamp-3 style-body-text leading-relaxed text-ink-muted">
          {description}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-1.5">
          {normalizedTags.map((t) => (
            <Tag key={t.label} label={t.label} bg={t.bg} color={t.color} />
          ))}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {isPast ? (
            // Show dynamic attendance status badges for past events
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium">
              {hasAttended ? (
                <span className="flex items-center gap-1.5 bg-[#d2ecd9]  px-3 py-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  Attended
                </span>
              ) : missedEvent ? (
                <span className="flex items-center gap-1.5 bg-[#fdf2f2] text-red-700 px-3 py-1 rounded-full border border-red-200">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-600">
                    <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
                  </svg>
                  Missed Event
                </span>
              ) : (
                <span className="bg-stone-100 text-ink-muted px-3 py-1 rounded-full">
                  Not RSVP'd
                </span>
              )}
            </div>
          ) : (
            // Active RSVP button for upcoming events
            <Button 
              variant={hasRsvpd ? "outline" : "primary"}
              size="sm" 
              onClick={handleAction} 
              disabled={isSubmitting} 
              className="flex items-center gap-1.5 w-[90px] justify-center" 
            >
              {isSubmitting ? (
                "..."
              ) : hasRsvpd ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  RSVP'd
                </>
              ) : (
                "RSVP"
              )}
            </Button>
          )}

          {message && !isPast && (
            <p className="style-body-text text-ink-faint">{message}</p>
          )}
        </div>
      </div>
    </Link>
  );
}