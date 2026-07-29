import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import {
  eventsHero,
  featuredEvent,
  sideEvent,
  miniEvent,
  pastTiles,
} from "@/lib/data";

export function MobileEvents() {
  return (
    <MobileScreen>
      <div className="flex flex-col gap-[10px]">
        <h1 className="font-mobile-display text-[24px] font-bold text-brand">
          {eventsHero.title}
        </h1>
        <p className="font-mobile-body text-[14px] text-ink">
          {eventsHero.subtitle}
        </p>
        <div className="flex gap-[8px]">
          <Badge label="Upcoming (3)" bg="#fbe3cb" color="#7a4416" />
          <Badge label="Past Adventures" variant="outline" />
        </div>
      </div>

      {/* Featured event */}
      <div className="flex flex-col gap-[16px] overflow-hidden rounded-[16px] border border-border-soft bg-brand-soft p-[20px]">
        <div>
          <Badge label={featuredEvent.badge} bg="#fbe3cb" color="#7a4416" />
          <h2 className="mt-[10px] font-mobile-display text-[19px] font-bold text-ink">
            {featuredEvent.title}
          </h2>
          <p className="mt-[8px] font-mobile-body text-[13px] text-ink-muted">
            {featuredEvent.description}
          </p>
        </div>
        <div className="flex h-[120px] items-center justify-center rounded-[12px] bg-photo">
          <span className="font-mono text-[11px] tracking-[1.5px] text-photo-text">
            PHOTO
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-[12px]">
          <div className="flex gap-[8px]">
            {featuredEvent.tags.map((t) => (
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
            <span className="font-mono text-[11px] tracking-[1.5px] text-photo-text">
              FLYER
            </span>
          </div>
          <p className="mt-[9px] font-mono text-[11px] text-brand">
            {sideEvent.date}
          </p>
          <h3 className="font-mobile-display text-[15px] font-bold text-ink">
            {sideEvent.title}
          </h3>
          <p className="mt-[6px] font-mobile-body text-[13px] text-ink-muted">
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
          <div className="flex size-[56px] shrink-0 items-center justify-center rounded-[10px] bg-[#cfcbe0] text-[22px]">
            {miniEvent.icon}
          </div>
          <div className="min-w-px flex-1">
            <p className="font-mono text-[11px] text-purple-ink">
              {miniEvent.date}
            </p>
            <h3 className="font-mobile-display text-[14px] font-bold text-ink">
              {miniEvent.title}
            </h3>
            <p className="font-mobile-body text-[12px] text-ink-muted">
              {miniEvent.description}
            </p>
          </div>
        </div>

        <Link href="/events/browse">
          <Button variant="accent" size="md" block>
            Browse Events →
          </Button>
        </Link>
      </div>

      {/* Slogan banner (bleeds past the screen padding) */}
      <div className="-mx-[20px] rotate-[-0.8deg] scale-[1.03] bg-brand py-[12px]">
        <p className="text-center font-mobile-display text-[14px] tracking-[1px] text-white">
          BUILD THE FUTURE · AIS UTD · JOIN THE MOVEMENT
        </p>
      </div>

      {/* Past Adventures */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center justify-between">
          <h2 className="font-mobile-display text-[17px] font-bold text-ink">
            Past Adventures
          </h2>
          <a href="#" className="font-mono text-[11px] text-brand">
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
                <span className="font-mobile-display text-[22px] font-bold text-orange-ink">
                  {tile.stat}
                </span>
                <span className="font-mono text-[10px] tracking-[0.2px] text-orange-ink">
                  {tile.label}
                </span>
              </div>
            ) : (
              <div
                key={i}
                className="flex h-[100px] items-center justify-center rounded-[14px] bg-photo"
              >
                <span className="font-mono text-[10px] tracking-[1px] text-photo-text">
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
