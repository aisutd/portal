"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import type { TagData } from "@/components/dashboard/up-next-card";

export type RecommendedItem = {
  title: string;
  tags: TagData[];
};

function RecommendedRow({ item }: { item: RecommendedItem }) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  function handleRsvp() {
    if (!isSignedIn) {
      router.push("/onboarding?mode=login");
      return;
    }
  }

  return (
    <div className="flex w-full items-center justify-between rounded-xl bg-row-soft px-[18px] py-[14px]">
      <div className="flex items-center gap-[12px]">
        <div className="size-[52px] shrink-0 rounded-xl bg-photo" />
        <div className="flex flex-col">
          <span className="font-body text-[15px] font-bold leading-[22.5px] text-ink">
            {item.title}
          </span>
          <div className="flex gap-[6px] pt-[1px]">
            {item.tags.map((tag) => (
              <Tag key={tag.label} {...tag} />
            ))}
          </div>
        </div>
      </div>
      <Button variant="primary" size="sm" onClick={handleRsvp} type="button">
        RSVP
      </Button>
    </div>
  );
}

export function RecommendedCard({ items }: { items: RecommendedItem[] }) {
  return (
    <Card className="flex min-w-px flex-1 flex-col gap-[14px] self-stretch p-[27px]">
      <SectionHeader
        title="Recommended for you"
        action={
          <a
            href="#"
            className="font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-brand"
          >
            Refresh
          </a>
        }
      />
      {items.length === 0 ? (
        <div className="flex h-[160px] w-full items-center justify-center rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6]">
          <span className="font-body text-[14px] text-ink-faint">No upcoming events.</span>
        </div>
      ) : (
        items.map((item) => (
          <RecommendedRow key={item.title} item={item} />
        ))
      )}
    </Card>
  );
}
