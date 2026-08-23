import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import type { TagData } from "@/components/dashboard/up-next-card";

export type SideEvent = {
  date: string;
  title: string;
  description: string;
  tag: TagData;
};

/**
 * Vertical event card with a flyer placeholder, schedule, blurb, one category
 * tag, and a "Claim Spot" CTA.
 */
export function SideEventCard({ date, title, description, tag }: SideEvent) {
  return (
    <div className="flex flex-col rounded-[16px] border border-border-soft bg-white p-[22px]">
      <div className="flex h-[96px] w-full items-center justify-center rounded-[12px] bg-photo">
        <span className="style-caption tracking-[1.5px] text-photo-text">
          FLYER
        </span>
      </div>
      <p className="mt-[9px] style-meta-text  leading-[16.8px] tracking-[0.2px] text-brand">
        {date}
      </p>
      <h3 className="mt-[9px] style-card-title  leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
        {title}
      </h3>
      <p className="mt-[11px] style-body-text  leading-[20.3px] text-ink-muted">
        {description}
      </p>
      <div className="mt-[10px] flex items-center justify-between">
        <Tag label={tag.label} bg={tag.bg} color={tag.color} />
        <Button variant="accent" size="sm">
          Claim Spot
        </Button>
      </div>
    </div>
  );
}
