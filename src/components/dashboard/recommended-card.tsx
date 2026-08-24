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
  id?: string;
  imageUrl: string | null;
  title: string;
  tags: TagData[];
};

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

  async function handleRsvp() {
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
        if (item.id) {
          onRsvpSuccess?.(item.id);
        }
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
    <div className="flex w-full items-center justify-between rounded-xl bg-row-soft px-[18px] py-[14px]">
      <div className="flex items-center gap-[12px]">
        <EventCoverImage imageUrl={item.imageUrl} className="size-[52px] shrink-0 rounded-xl bg-photo" />
        <div className="flex flex-col">
          <span className="style-card-title  leading-[22.5px] text-ink">
            {item.title}
          </span>
          <div className="flex gap-[6px] pt-[1px]">
            {item.tags.map((tag, tagIndex) => (
              <Tag key={`${tag.label}-${tagIndex}`} {...tag} />
            ))}
          </div>
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={handleRsvp}
        type="button"
        disabled={loading}
      >
        {loading ? "RSVPing..." : "RSVP"}
      </Button>
    </div>
  );
}

export function RecommendedCard({ items }: { items: RecommendedItem[] }) {
  const [displayItems, setDisplayItems] = useState(items);

  useEffect(() => {
    setDisplayItems(items);
  }, [items]);

  function handleRsvpSuccess(eventId: string) {
    setDisplayItems((prev) => prev.filter((item) => item.id !== eventId));
  }

  return (
    <Card className="flex min-w-px flex-1 flex-col gap-[14px] self-stretch p-[27px]">
      <SectionHeader
        title="Recommended for you"
        action={
          <Link
            href="/events"
            className="style-meta-text leading-[16.8px] tracking-[0.2px] text-brand hover:underline font-semibold flex items-center gap-1"
          >
            Browse Events →
          </Link>
        }
      />
      
      <div className="flex flex-col gap-[14px]">
        {displayItems.length === 0 ? (
          <div className="flex flex-col gap-[12px] h-[120px] w-full items-center justify-center rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6]">
            <span className="style-body-text text-ink-faint">No upcoming events.</span>
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

      {/* Light blue callout banner at bottom */}
      <div className="mt-auto flex w-full flex-col items-start justify-between gap-[12px] rounded-xl bg-[#e1e8ff] px-[20px] py-[16px] sm:flex-row sm:items-center">
        <span className="style-card-title text-[15px] font-medium leading-[20px] text-[#1f3aa3]">
          Nothing on your calendar this week?
        </span>
        <Link href="/events" className="shrink-0">
          <Button variant="accent" size="sm" pill className="font-bold">
            Browse Events →
          </Button>
        </Link>
      </div>
    </Card>
  );
}
