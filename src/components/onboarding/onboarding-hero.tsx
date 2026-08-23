import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Left half of the ONBOARDING frame: brand badge, display heading,
 * supporting copy, and the Discord call-to-action.
 */
export function OnboardingHero() {
  return (
    <div className="flex h-full flex-col justify-center gap-6 bg-cream p-8 md:p-12 lg:p-20">
      {/* Badge */}
      <div>
         <img
          className="h-10 shrink-0 object-contain sm:h-12"
          src="/ais_logo_black.png"
          alt="AIS Logo"
        />
      </div>

      {/* Display heading */}
      <h1 className="font-logo text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl lg:leading-[1.1]">
        Step into the <br className="hidden lg:block" /> 
        world of <span className="text-brand">artificial</span> <br /> 
        <span className="text-brand">intelligence</span>
      </h1>

      {/* Supporting copy */}
      <p className="max-w-[420px] style-body-text text-base font-normal leading-relaxed text-ink md:text-lg">
        The hub for creators, thinkers, and builders at UT Dallas. Whether you&apos;re training models or just here for the energy — welcome home.
      </p>

      {/* CTA */}
      <div>
        <Button href="https://discord.gg/JFEkPHjzEK" variant="accent" size="lg">
          Join Discord ↗
        </Button>
      </div>
    </div>
  );
}
