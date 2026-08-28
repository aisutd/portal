"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import type { TagData } from "@/components/dashboard/up-next-card";
import { EventCoverImage } from "../events/event-cover-image";

export type RecommendedItem = {
  id: string;
  imageUrl: string | null;
  title: string;
  startTime: string | Date;
  endTime?: string | Date | null;
  location: string;
  tags: TagData[];
};

function formatEventDateTime(startTime?: string | Date | null) {
  if (!startTime) return "TBD";

  const dateObj = typeof startTime === "string" ? new Date(startTime) : startTime;

  if (isNaN(dateObj.getTime())) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(dateObj);
}

function isUpcomingOrOngoing(item: RecommendedItem): boolean {
  const now = new Date().getTime();
  
  // Use endTime if present; fallback to startTime
  const targetTime = item.endTime ?? item.startTime;
  if (!targetTime) return false;

  const dateObj = typeof targetTime === "string" ? new Date(targetTime) : targetTime;
  const timestamp = dateObj.getTime();

  return !isNaN(timestamp) && timestamp > now;
}

function RecommendedRow({
  item,
  onRsvpSuccess,
}: {
  item: RecommendedItem;
  onRsvpSuccess?: (id: string) => void;
}) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const formattedDateTime = formatEventDateTime(item.startTime);

  async function handleRsvp(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      router.push("/onboarding?mode=login");
      return;
    }

    if (!item.id || loading) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/events/${item.id}/rsvp`, {
        method: "POST",
      });

      if (res.ok || res.status === 409) {
        onRsvpSuccess?.(item.id);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data?.error || "Failed to RSVP");
      }
    } catch {
      alert("Failed to RSVP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Link
      href={`/events/${item.id}`}
      className="group flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl bg-row-soft px-[18px] py-[14px] transition-colors hover:bg-[#eae6dc]"
    >
      <div className="flex flex-1 items-start sm:items-center gap-[14px] min-w-0 w-full">
        <EventCoverImage
          imageUrl={item.imageUrl}
          className="size-[56px] shrink-0 rounded-xl bg-photo"
        />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="style-card-title leading-[20px] text-ink group-hover:text-brand break-words">
            {item.title}
          </span>

          <span className="style-caption font-medium text-ink-muted break-words">
            {formattedDateTime} · {item.location}
          </span>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-[6px] pt-[2px]">
              {item.tags.map((tag, tagIndex) => (
                <Tag key={`${tag.label}-${tagIndex}`} {...tag} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={handleRsvp}
        type="button"
        disabled={loading}
        className="shrink-0 self-end sm:self-center w-full sm:w-auto"
      >
        {loading ? "RSVPing..." : "RSVP"}
      </Button>
    </Link>
  );
}

export function RecommendedCard({ items }: { items: RecommendedItem[] }) {
  const [displayItems, setDisplayItems] = useState(() => 
    items.filter(isUpcomingOrOngoing)
  );

  useEffect(() => {
    // Re-filter whenever props update
    setDisplayItems(items.filter(isUpcomingOrOngoing));
  }, [items]);

  function handleRsvpSuccess(eventId: string) {
    setDisplayItems((prev) => prev.filter((item) => item.id !== eventId));
  }

  return (
    <Card className="flex h-auto min-w-0 flex-1 flex-col gap-[14px] self-stretch p-[27px]">
      <SectionHeader
        title="Recommended for you"
      />

      <div className="flex flex-col gap-[14px] h-auto w-full">
        {displayItems.length === 0 ? (
          <div className="flex h-[120px] w-full flex-col items-center justify-center gap-[12px] rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6]">
            <span className="style-body-text text-ink-faint">
              No upcoming events.
            </span>
          </div>
        ) : (
          displayItems.map((item, index) => (
            <RecommendedRow
              key={item.id ?? `${item.title}-${index}`}
              item={item}
              onRsvpSuccess={handleRsvpSuccess}
            />
          ))
        )}
      </div>

      {/* Callout banner */}
      <div className="mt-auto flex w-full flex-col items-start justify-between gap-[12px] rounded-xl bg-[#e1e8ff] px-[20px] py-[16px] sm:flex-row sm:items-center">
        <span className="style-card-title text-[15px] font-medium leading-[20px] text-[#1f3aa3]">
          Nothing on your calendar this week?
        </span>
        <Link href="/events" className="shrink-0 w-full sm:w-auto">
          <Button variant="accent" size="sm" pill className="w-full sm:w-auto font-bold">
            Browse Events →
          </Button>
        </Link>
      </div>
    </Card>
  );
}