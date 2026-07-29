import { Button } from "@/components/ui/button";
import Link from "next/link"

/**
 * Left half of the ONBOARDING frame: brand badge, display heading,
 * supporting copy, and the Discord call-to-action.
 */
export function OnboardingHero() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-[23px] bg-cream p-8 sm:p-12 lg:p-[84px]">
      {/* Badge */}
      <div>
        <span className="inline-flex rounded-[10px] border border-brand px-[15px] py-[9px] font-logo text-[15px] tracking-[1px] text-brand">
          AIS
        </span>
      </div>

      {/* Display heading */}
      <h1 className="font-logo text-[46px] leading-[51.52px] tracking-[-0.5px] text-ink">
        Step into the
        <br />
        world of <span className="text-brand">artificial</span>
        <br />
        <span className="text-brand">intelligence</span>
      </h1>

      {/* Supporting copy */}
      <p className="max-w-[420px] font-body text-[17px] font-normal leading-[25.5px] text-ink">
        The hub for creators, thinkers, and builders at UT Dallas. Whether
        you&apos;re training models or just here for the energy — welcome home.
      </p>

      {/* CTA */}
      <div>
        <Button variant="accent" size="lg">
          <Link href="https://discord.gg" target="_blank" rel="noopener noreferrer">
            Join Discord ↗
          </Link>
        </Button>
      </div>
    </div>
  );
}
