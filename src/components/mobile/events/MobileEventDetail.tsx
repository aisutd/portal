import Link from "next/link";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";

const eventTags = [
  { label: "social", bg: "#f6ecbb", color: "#766411" },
  { label: "food", bg: "#f9d5d3", color: "#9a3b36" },
  { label: "learn", bg: "#d3eccf", color: "#356b2e" },
];

export function MobileEventDetail() {
  return (
    <MobileScreen>
      <Link href="/events/browse" className="font-mono text-[12px] text-brand">
        ← All Events
      </Link>

      <div className="flex h-[220px] items-center justify-center rounded-[12px] bg-photo">
        <span className="font-mono text-[11px] tracking-[1.5px] text-photo-text">
          PHOTO
        </span>
      </div>

      <div className="flex flex-col gap-[10px]">
        <h1 className="font-mobile-display text-[24px] font-bold text-ink">
          Fall Kickoff
        </h1>
        <p className="font-mobile-body text-[14px] text-ink">
          Learn about AIS and get insider notes on how to apply to our
          initiatives like AIM, Innovation Labs and AI Academy.
        </p>
        <div className="flex gap-[8px]">
          {eventTags.map((t) => (
            <Tag key={t.label} label={t.label} bg={t.bg} color={t.color} />
          ))}
        </div>
        <p className="font-mono text-[12px] text-ink-faint">
          Aug 27, 2026 · 7:00 PM · ECSW 1.315
        </p>
      </div>

      {/* Checked-in card */}
      <div className="flex flex-col items-center gap-[16px] rounded-[16px] bg-[#d2ecd9] p-[24px]">
        <h2 className="font-mobile-display text-[19px] font-bold text-[#2c5d3e]">
          Checked In!!
        </h2>

        <div
          className="relative size-[160px] rounded-[10px] border border-ink"
          style={{
            backgroundImage:
              "linear-gradient(0deg, #3a3a40 0 2.5253%, transparent 2.5253% 5.0505%), linear-gradient(90deg, #3a3a40 0 2.5253%, transparent 2.5253% 5.0505%), linear-gradient(90deg, #fff 0 100%)",
          }}
        >
          <div className="absolute inset-[calc(36.13%-0.28px)] border border-ink bg-white" />
        </div>

        <Button variant="primary" size="md" block>
          Add to Calendar
        </Button>
        <Button variant="accent" size="md" pill={false} block>
          Cancel RSVP
        </Button>
      </div>

      <BottomNav />
    </MobileScreen>
  );
}
