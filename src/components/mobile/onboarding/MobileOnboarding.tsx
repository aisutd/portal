"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/onboarding/auth-card";

function MobileOnboardingInner() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-brand style-mobile-body text-ink">
      
      {/* Top Cream Section */}
      <div className="flex w-full flex-col bg-cream pb-[5.5rem] pt-10 sm:pt-12">
        <div className="mx-auto flex w-full max-w-[430px] flex-col items-start px-6">
          <img
            className="h-14 shrink-0 object-contain"
            src="/ais_logo_black.png"
            alt="AIS Logo"
          />
          <h1 className="mt-4 text-left font-sans  font-bold leading-[1.1] text-ink sm:">
            Step into the<br />
            world of <span className="text-brand">artificial</span><br />
            <span className="text-brand">intelligence</span>
          </h1>
        </div>
      </div>

      {/* Bottom Content Area */}
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-6 pb-8">
        
        {/* Auth Card - Pulled up into the cream section using negative margin */}
        <div className="relative z-10 -mt-12 w-full">
          <AuthCard />
        </div>

        {/* Discord Footer Action */}
        <footer className="mt-auto flex w-full justify-center pt-10">
          <Link href="https://discord.gg/JFEkPHjzEK" target="_blank" rel="noopener noreferrer">
            <Button
              variant="accent"
              size="md"
              className="w-hug opacity-90 transition-opacity hover:opacity-100 sm:w-auto"
            >
              Join Discord ↗
            </Button>
          </Link>
        </footer>
        
      </div>
    </div>
  );
}

export function MobileOnboarding() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-brand" />}>
      <MobileOnboardingInner />
    </Suspense>
  );
}