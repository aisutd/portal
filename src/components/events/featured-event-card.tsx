"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import type { TagData } from "@/components/dashboard/up-next-card";
import { normalizeEventTags } from "@/lib/event-tags";

export type FeaturedEvent = {
  badge: string;
  title: string;
  description: string;
  tags: Array<string | TagData>;
};

/**
 * The large highlighted event on the Events page: pale-blue panel with a
 * "Featured" pill, title, blurb, category tags, and an RSVP CTA.
 */
export function FeaturedEventCard({
  badge,
  title,
  description,
  tags,
}: FeaturedEvent) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const normalizedTags = normalizeEventTags(tags);

  function handleRsvpNow() {
    if (!isSignedIn) {
      router.push("/onboarding?mode=login");
      return;
    }
  }

  return (
    <div className="flex min-h-[300px] flex-1 flex-col justify-between self-stretch overflow-hidden rounded-[16px] border border-border-soft bg-brand-soft p-[28px]">
      <div>
        <span className="inline-flex rounded-full bg-orange-soft px-[14px] py-[5px] font-body text-[13px] font-semibold leading-[normal] text-orange-ink">
          {badge}
        </span>
        <h2 className="mt-[13px] font-display text-[30px] font-bold leading-[32.4px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
          {title}
        </h2>
        <p className="mt-[14px] font-body text-[14px] font-normal leading-[20.3px] text-ink-muted">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[16px]">
        <div className="flex gap-[8px]">
          {normalizedTags.map((t) => (
            <Tag key={t.label} label={t.label} bg={t.bg} color={t.color} />
          ))}
        </div>
        <Button variant="primary" size="md" pill onClick={handleRsvpNow} type="button">
          RSVP Now
        </Button>
      </div>
    </div>
  );
}
