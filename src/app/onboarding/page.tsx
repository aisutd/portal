import type { Metadata } from "next";
import { OnboardingHero } from "@/components/onboarding/onboarding-hero";
import { AuthCard } from "@/components/onboarding/auth-card";
import { MobileOnboarding } from "@/components/mobile/onboarding/MobileOnboarding";
import { getAuthenticatedUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "AIS Portal — Get Started",
  description: "Create your AIS account with your UTD email.",
};

export default async function OnboardingPage() {

  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }
  
  return (
    <>
      <div className="md:hidden">
        <MobileOnboarding />
      </div>

      <div className="hidden md:block">
        {/* Force immediate side-by-side horizontal split on all desktop/tablet sizes */}
        <main className="hidden min-h-screen w-full bg-cream md:flex md:flex-row">
          <section className="w-1/2">
            <OnboardingHero />
          </section>
          <section className="flex w-1/2 items-center justify-center bg-brand p-8">
            <AuthCard />
          </section>
        </main>

      </div>
    </>
  );
}
