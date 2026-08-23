import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";

export type Announcement = { title: string; body: string };

function AnnouncementBlock({ item }: { item: Announcement }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <p className="style-card-title text-[15px] leading-[22.5px] text-orange-ink">
        {item.title}
      </p>
      <p className="style-body-text text-[14px] leading-[20.3px] text-orange-ink">
        {item.body}
      </p>
    </div>
  );
}

export function AnnouncementsCard({ items }: { items: [Announcement, Announcement] }) {
  return (
    <section className="relative min-h-[223px] w-full shrink-0 self-stretch rounded-2xl border border-transparent bg-orange-soft xl:w-auto xl:flex-1">
      <div className="absolute inset-x-[26px] top-[26px]">
        <SectionHeader
          title="Announcements"
          titleClassName="text-orange-ink"
          action={<Badge label="2 new" bg="#fbe3cb" color="#7a4416" />}
        />
      </div>

      <div className="absolute inset-x-[26px] top-[65px]">
        <AnnouncementBlock item={items[0]} />
      </div>

      <div className="absolute inset-x-[26px] top-[128.8px] flex h-[5px] flex-col py-[2px]">
        <span className="h-px w-full border-t border-[#eecaa6]" />
      </div>

      <div className="absolute inset-x-[26px] top-[146.8px]">
        <AnnouncementBlock item={items[1]} />
      </div>
    </section>
  );
}
