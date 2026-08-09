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
      {/* Back button - slightly larger text for better touch target */}
      <Link 
        href="/events/browse" 
        className="inline-flex items-center py-1 font-mono text-[13px] font-bold text-brand transition-opacity hover:opacity-80"
      >
        ← All Events
      </Link>

      {/* Image / Banner */}
      <div className="flex h-55 w-full shrink-0 items-center justify-center rounded-2xl bg-photo shadow-sm">
        <span className="font-mono text-[12px] font-medium tracking-[2px] text-photo-text">
          PHOTO
        </span>
      </div>

      {/* Event Details */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-mobile-display text-[26px] font-bold leading-tight text-ink">
            Fall Kickoff
          </h1>
          <p className="font-mono text-[13px] font-medium text-ink-muted">
            Aug 27, 2026 · 7:00 PM · ECSW 1.315
          </p>
        </div>

        {/* Tags container - added flex-wrap so they break to a new line gracefully */}
        <div className="flex flex-wrap gap-2">
          {eventTags.map((t) => (
            <Tag key={t.label} label={t.label} bg={t.bg} color={t.color} />
          ))}
        </div>

        <p className="font-mobile-body text-[15px] leading-relaxed text-ink-muted">
          Learn about AIS and get insider notes on how to apply to our
          initiatives like AIM, Innovation Labs and AI Academy.
        </p>
      </div>

      {/* Status / Action card */}
      <div className="mt-2 flex flex-col items-center gap-5 rounded-[20px] bg-checked p-6 shadow-sm">
        <div className="text-center">
          <h2 className="font-mobile-display text-[22px] font-bold text-checked-text">
            Checked In!!
          </h2>
          <p className="mt-1 font-mobile-body text-[13px] text-checked-text/80">
            Show this QR code at the door
          </p>
        </div>

        {/* Placeholder QR Code */}
        <div
          className="relative size-40 rounded-xl border-2 border-ink bg-white shadow-sm"
          style={{
            backgroundImage:
              "linear-gradient(0deg, #3a3a40 0 2.5253%, transparent 2.5253% 5.0505%), linear-gradient(90deg, #3a3a40 0 2.5253%, transparent 2.5253% 5.0505%), linear-gradient(90deg, #fff 0 100%)",
          }}
        >
          <div className="absolute inset-[calc(36.13%-0.28px)] border-2 border-ink bg-white" />
        </div>

        {/* Action Buttons */}
        <div className="flex w-full flex-col gap-2.5">
          <Button variant="primary" size="md" block>
            Add to Calendar
          </Button>
          <Button variant="accent" size="md" block>
            Cancel RSVP
          </Button>
        </div>
      </div>

      <BottomNav />
    </MobileScreen>
  );
}