import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { MobileEventDetail } from "@/components/mobile/events/MobileEventDetail";

export const metadata: Metadata = {
  title: "Events — Fall Kickoff",
  description: "Fall Kickoff event details and check-in.",
};

const eventTags = [
  { label: "social", bg: "#f6ecbb", color: "#766411" },
  { label: "food", bg: "#f9d5d3", color: "#9a3b36" },
  { label: "learn", bg: "#d3eccf", color: "#356b2e" },
];

export default function EventDetailPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileEventDetail />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar active="Events" />

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[28px] px-[46px] pb-[46px] pt-[45px]">
            {/* Back link */}
            <a
              href="#"
              className="font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-brand"
            >
              ← All Events
            </a>

            <div className="flex flex-col gap-[32px] lg:flex-row lg:items-stretch">
              {/* Event body */}
              <div className="flex min-w-px flex-1 flex-col">
                <div className="flex h-[300px] w-full items-center justify-center rounded-[12px] bg-photo">
                  <span className="font-mono text-[11px] tracking-[1.5px] text-photo-text">
                    PHOTO
                  </span>
                </div>
                <h1 className="mt-[16px] font-display text-[38px] font-bold leading-[41px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                  Fall Kickoff
                </h1>
                <p className="mt-[16px] max-w-[640px] font-body text-[16px] font-normal leading-[24px] text-ink">
                  Learn about AIS and get insider notes on how to apply to our
                  initiatives like AIM, Innovation Labs and AI Academy.
                </p>
                <div className="mt-[16px] flex gap-[10px]">
                  {eventTags.map((t) => (
                    <Tag key={t.label} label={t.label} bg={t.bg} color={t.color} />
                  ))}
                </div>
                <p className="mt-[16px] font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-ink-faint">
                  Aug 27, 2026 · 7:00 PM · ECSW 1.315
                </p>
              </div>

              {/* Checked-in card */}
              <div className="flex w-full flex-col items-center gap-[16px] self-stretch rounded-[16px] bg-[#d2ecd9] p-[33px] lg:w-[340px] lg:shrink-0">
                <h2 className="font-display text-[22px] font-semibold leading-[25.96px] text-[#2c5d3e] [font-variation-settings:'wdth'_100]">
                  Checked In!!
                </h2>

                {/* Decorative QR placeholder */}
                <div
                  className="relative size-[200px] rounded-[10px] border border-ink"
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
