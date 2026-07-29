import type { Metadata } from "next";
import { OnboardingHero } from "@/components/onboarding/onboarding-hero";
import { AuthCard } from "@/components/onboarding/auth-card";
import { MobileOnboarding } from "@/components/mobile/onboarding/MobileOnboarding";

export const metadata: Metadata = {
  title: "AIS Portal — Get Started",
  description: "Create your AIS account with your UTD email.",
};

export default function OnboardingPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileOnboarding />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          {/* Split composition: cream hero + brand auth panel. Stacks below lg. */}
          <div className="flex w-full flex-col lg:min-h-[1045px] lg:flex-row">
            <OnboardingHero />

            <div className="flex flex-1 items-center justify-center bg-brand p-8 sm:p-12 lg:p-[84px]">
              <AuthCard />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
