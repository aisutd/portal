import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export type RsvpItem = {
  day: string;
  title: string;
  detail: string;
  eventId: string;
  attended?: boolean;
  isPast?: boolean;
};

function RsvpRow({ item }: { item: RsvpItem }) {
  const renderBadge = () => {
    if (item.attended) {
      return (
        <Badge
          variant="solid"
          label="Attended"
          bg="#d3eccf"
          color="#356b2e"
        />
      );
    }

    if (item.isPast) {
      return (
        <Badge
          variant="solid"
          label="Missed"
          bg="#f9d5d3"
          color="#9a3b36"
        />
      );
    }

    return <Badge variant="outline" label="RSVP'd" />;
  };

  return (
    <Link
      href={`/events/${item.eventId}`}
      className="flex w-full items-center justify-between gap-[12px] group"
    >
      <div className="flex items-center gap-[12px] min-w-0">
        <div
          className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: "linear-gradient(135deg, #f2a968 0%, #7d64c4 100%)" }}
        >
          <span className="style-meta-text leading-[16.8px] tracking-[1px] text-white">
            {item.day}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="style-card-title truncate leading-[22.5px] text-ink group-hover:text-brand transition-colors">
            {item.title}
          </span>
          <span className="style-meta-text leading-[16.8px] tracking-[0.2px] text-ink-faint">
            {item.detail}
          </span>
        </div>
      </div>

      <div className="shrink-0">{renderBadge()}</div>
    </Link>
  );
}

export function RsvpsCard({ items }: { items: RsvpItem[] }) {
  return (
    <Card className="relative flex w-full shrink-0 flex-col gap-[16px] self-stretch overflow-hidden p-[29px] xl:w-[360px]">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[4px] bg-purple-300" />
      <SectionHeader title="Your Events & RSVPs" />
      <div className="flex max-h-[380px] flex-col gap-[20px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="flex min-h-[170px] w-full flex-1 items-center justify-center rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6]">
            <span className="style-body-text text-ink-faint">
              No registered events or RSVPs.
            </span>
          </div>
        ) : (
          items.map((item, index) => (
            <RsvpRow
              key={item.eventId ?? `${item.title}-${index}`}
              item={item}
            />
          ))
        )}
      </div>
    </Card>
  );
}