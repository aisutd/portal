"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
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
};

export function EventGridCard({ 
  title, 
  meta, 
  description, 
  tags, 
  eventId, 
  isRsvpd = false 
}: EventGridItem) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  
  const [hasRsvpd, setHasRsvpd] = useState(isRsvpd);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const normalizedTags = normalizeEventTags(tags);

  // Sync state if Next.js fetches new data (important for Server Components)
  useEffect(() => {
    setHasRsvpd(isRsvpd);
  }, [isRsvpd]);

  async function handleAction() {
    if (!isSignedIn) {
      router.push("/onboarding?mode=login");
      return;
    }

    // If they are already going, ask for confirmation (solves the mobile issue)
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
        setHasRsvpd(!hasRsvpd); // Toggle the state instantly
        setMessage(hasRsvpd ? "RSVP canceled" : "See you there!");
        router.refresh(); // Tells Next.js to re-fetch Server Components quietly in the background
      } else if (response.status === 409) {
        // Failsafe: If the backend says they are already going, fix the UI!
        setHasRsvpd(true);
        setMessage(null);
      } else {
        setMessage(payload.error ?? "Something went wrong");
      }
    } catch (error) {
      setMessage("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border-soft bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex h-37.5 w-full shrink-0 items-center justify-center rounded-xl bg-photo">
        <span className="font-mono text-[11px] tracking-[1.5px] text-photo-text">
          PHOTO
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <h3 className="mt-4 line-clamp-2 style-card-title text-[18px] leading-tight text-ink [font-variation-settings:'wdth'_100]">
          {title}
        </h3>
        <p className="mt-1.5 style-meta-text text-[12px] tracking-wide text-ink-faint">
          {meta}
        </p>
        <p className="mt-3 line-clamp-3 style-body-text text-[14px] leading-relaxed text-ink-muted">
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
          {message && (
            <p className="text-[11px] font-medium text-ink-faint">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}