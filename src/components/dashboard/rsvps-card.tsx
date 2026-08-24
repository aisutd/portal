import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import Link from "next/link";

export type RsvpItem = {
  day: string;
  title: string;
  detail: string;
  id: string;
};

function RsvpRow({ item }: { item: RsvpItem }) {
  return (
    <Link
      href={`/events/${item.id}`}
      className="flex w-full items-center gap-[12px]">
      <div className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-brand-soft">
        <span className="style-meta-text  leading-[16.8px] tracking-[1px] text-brand-dark">
          {item.day}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="style-card-title  leading-[22.5px] text-ink">
          {item.title}
        </span>
        <span className="style-meta-text  leading-[16.8px] tracking-[0.2px] text-ink-faint">
          {item.detail}
        </span>
      </div>
    </Link>
  );
}

export function RsvpsCard({ items }: { items: RsvpItem[] }) {
  return (
    <Card className="flex w-full shrink-0 flex-col gap-[16px] self-stretch xl:w-[360px] p-[29px]">
      <SectionHeader title="Your RSVPs" />
      <div className="flex flex-1 flex-col gap-[20px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="flex flex-1 min-h-[170px] w-full items-center justify-center rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6]">
            <span className="style-body-text text-ink-faint">No upcoming RSVPs.</span>
          </div>
        ) : (
          items.map((item, index) => (
            <RsvpRow key={item.id ?? `${item.title}-${index}`} item={item} />
          ))
        )}
      </div>
    </Card>
  );
}
