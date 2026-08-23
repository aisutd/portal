"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import type { TagData } from "@/components/dashboard/up-next-card";

export type RecommendedItem = {
  id?: string;
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
        <div className="size-[52px] shrink-0 rounded-xl bg-photo" />
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
          <a
            href="#"
            className="style-meta-text  leading-[16.8px] tracking-[0.2px] text-brand"
          >
            Refresh
          </a>
        }
      />
      {displayItems.length === 0 ? (
        <div className="flex h-[160px] w-full items-center justify-center rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6]">
          <span className="style-body-text  text-ink-faint">No upcoming events.</span>
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
    </Card>
  );
}
