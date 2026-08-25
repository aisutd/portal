//deprecate

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { normalizeEventTags } from "@/lib/event-tags";
import {
  eventsHero,
  featuredEvent,
  sideEvent,
  miniEvent,
  pastTiles,
} from "@/lib/data";
import { deprecate } from "util";

export function MobileEvents() {
  const featuredTags = normalizeEventTags(featuredEvent.tags);

  return (
    <MobileScreen>
      <div className="flex flex-col gap-[10px]">
        <h1 className="font-sans  font-bold text-brand">
          {eventsHero.title}
        </h1>
        <p className="font-sans  font-normal text-ink-muted">
          {eventsHero.subtitle}
        </p>
        <div className="flex gap-[8px]">
          <Badge label="Upcoming (3)" bg="#fbe3cb" color="#7a4416" />
          <Badge label="Past Adventures" variant="outline" />
        </div>
      </div>
      
      <Link href="/events">
          <Button variant="accent" size="md" block>
            Browse Events →
          </Button>
      </Link>

      {/* Featured event */}
      <div className="flex flex-col gap-[16px] overflow-hidden rounded-[16px] border border-border-soft bg-brand-soft p-[20px]">
        <div>
          <Badge label={featuredEvent.badge} bg="#fbe3cb" color="#7a4416" />
          <h2 className="mt-[10px] font-sans  font-bold text-ink">
            {featuredEvent.title}
          </h2>
          <p className="mt-[8px] font-sans  font-normal text-ink-muted">
            {featuredEvent.description}
          </p>
        </div>
        <div className="flex h-[120px] items-center justify-center rounded-[12px] bg-photo">
          <span className="font-sans  font-bold tracking-[1.5px] text-photo-text">
            PHOTO
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-[12px]">
          <div className="flex gap-[8px]">
            {featuredTags.map((t) => (
              <Tag key={t.label} label={t.label} bg={t.bg} color={t.color} />
            ))}
          </div>
          <Button variant="primary" size="sm" pill>
            RSVP Now
          </Button>
        </div>
      </div>

      {/* Side event + recurring event */}
      <div className="flex flex-col gap-[12px]">
        <div className="rounded-[16px] border border-border-soft bg-white p-[16px]">
          <div className="flex h-[90px] items-center justify-center rounded-[10px] bg-photo">
            <span className="font-sans  font-bold tracking-[1.5px] text-photo-text">
              FLYER
            </span>
          </div>
          <p className="mt-[9px] font-sans  font-bold text-brand">
            {sideEvent.date}
          </p>
          <h3 className="font-sans  font-bold text-ink">
            {sideEvent.title}
          </h3>
          <p className="mt-[6px] font-sans  font-normal text-ink-muted">
            {sideEvent.description}
          </p>
          <div className="mt-[10px] flex items-center justify-between">
            <Tag label={sideEvent.tag.label} bg={sideEvent.tag.bg} color={sideEvent.tag.color} />
            <Button variant="accent" size="sm">
              Claim Spot
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-[12px] rounded-[16px] border border-border-soft bg-purple-soft p-[16px]">
          <div className="flex size-[56px] shrink-0 items-center justify-center rounded-[10px] bg-[#cfcbe0] ">
            {miniEvent.icon}
          </div>
          <div className="min-w-px flex-1">
            <p className="font-sans  font-bold text-purple-ink">
              {miniEvent.date}
            </p>
            <h3 className="font-sans  font-bold text-ink">
              {miniEvent.title}
            </h3>
            <p className="font-sans  font-normal text-ink-muted">
              {miniEvent.description}
            </p>
          </div>
        </div>

      </div>

      {/* Slogan banner (bleeds past the screen padding) */}
      <div className="-mx-[20px] overflow-x-hidden py-[2px]">
        <div className="rotate-[-0.8deg] bg-brand py-[12px]">
          <p className="whitespace-nowrap text-center font-sans  font-bold tracking-[0.5px] text-white">
            BUILD THE FUTURE · AIS UTD · JOIN THE MOVEMENT
          </p>
        </div>
      </div>

      {/* Past Adventures */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center justify-between">
          <h2 className="font-sans  font-bold text-ink">
            Past Adventures
          </h2>
          <a href="#" className="font-sans  font-bold text-brand">
            View Full Gallery →
          </a>
        </div>
        <div className="grid grid-cols-2 gap-[12px]">
          {pastTiles.map((tile, i) =>
            tile.variant === "stat" ? (
              <div
                key={i}
                className="flex h-[100px] flex-col items-center justify-center rounded-[14px] border border-border-soft bg-orange-soft"
              >
                <span className="font-sans  font-bold text-orange-ink">
                  {tile.stat}
                </span>
                <span className="font-sans  font-bold tracking-[0.2px] text-orange-ink">
                  {tile.label}
                </span>
              </div>
            ) : (
              <div
                key={i}
                className="flex h-[100px] items-center justify-center rounded-[14px] bg-photo"
              >
                <span className="font-sans  font-bold tracking-[1px] text-photo-text">
                  {tile.label}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      <BottomNav />
    </MobileScreen>
  );
}
