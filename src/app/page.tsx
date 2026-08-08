import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/apply/marquee";
import { FeaturedEventCard } from "@/components/events/featured-event-card";
import { SideEventCard } from "@/components/events/side-event-card";
import { MiniEventCard } from "@/components/events/mini-event-card";
import { PastTile } from "@/components/events/past-tile";
import { MobileEvents } from "@/components/mobile/events/MobileEvents";
import {
  eventsHero,
  featuredEvent,
  sideEvent,
  miniEvent,
  pastTiles,
} from "@/lib/data";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Events — What's Happening",
  description: "Upcoming AIS workshops, socials, and hackathons.",
};

export default function EventsPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileEvents />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar active="Events" />

          <div className="relative w-full pb-[46px] pt-[46px]">
            {/* Hero */}
            <div className="flex flex-col gap-[16px] px-[46px] pt-[45px] lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-[10px]">
                <h1 className="font-logo text-[48px] leading-[53.76px] tracking-[-0.5px] text-brand">
                  {eventsHero.title}
                </h1>
                <p className="max-w-[560px] font-body text-[16px] font-normal leading-[24px] text-ink">
                  {eventsHero.subtitle}
                </p>
                <div className="flex gap-[8px]">
                  <Badge label="Upcoming (3)" bg="#fbe3cb" color="#7a4416" />
                  <Badge label="Past Adventures" variant="outline" />
                </div>
              </div>

              <Link
                href="/events/browse"
                className="flex h-[75px] w-full items-center justify-center rounded-full bg-orange px-[21px] font-body text-[25px] font-semibold leading-none text-orange-ink [filter:drop-shadow(0px_5px_7px_rgba(242,169,104,0.34))] lg:w-[300px]"
              >
                Browse Events →
              </Link>
            </div>

            {/* Featured grid */}
            <div className="mt-[28px] flex flex-col gap-[24px] px-[46px] lg:flex-row lg:items-stretch">
              <FeaturedEventCard {...featuredEvent} />
              <div className="flex w-full flex-col gap-[24px] lg:w-[420px] lg:shrink-0">
                <SideEventCard {...sideEvent} />
                <MiniEventCard {...miniEvent} />
              </div>
            </div>

            {/* Host promo */}
            <div className="mt-[28px] flex flex-col gap-[24px] rounded-[16px] bg-brand p-[33px] mx-[46px] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-[8px]">
                <h2 className="font-display text-[32px] font-bold leading-[34.56px] tracking-[-0.4px] text-white [font-variation-settings:'wdth'_100]">
                  Wanna host an event?
                </h2>
                <p className="font-body text-[14px] font-normal leading-[20.3px] text-[#dfe6ff]">
                  The AIS platform belongs to the community. Propose your
                  workshop or social idea today.
                </p>
              </div>
              <Button variant="accent" size="lg" className="shrink-0 self-start sm:self-auto">
                Submit Proposal
              </Button>
            </div>

            {/* Slogan banner (full-bleed) */}
            <div className="mt-[17px]">
              <Marquee text="BUILD THE FUTURE · AIS UTD · JOIN THE MOVEMENT · AIS UTD" />
            </div>

            {/* Past adventures */}
            <div className="mt-[18px] flex flex-col gap-[16px] px-[46px]">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[22px] font-semibold leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]">
                  Past Adventures
                </h2>
                <a
                  href="#"
                  className="font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-brand"
                >
                  View Full Gallery →
                </a>
              </div>
              <div className="grid grid-cols-2 gap-[16px] lg:grid-cols-4">
                {pastTiles.map((tile, i) => (
                  <PastTile key={i} {...tile} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
