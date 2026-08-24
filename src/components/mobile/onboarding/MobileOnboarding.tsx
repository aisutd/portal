"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/onboarding/auth-card";

interface MobileOnboardingProps {
  redirectUrl?: string;
}

function MobileOnboardingInner({ redirectUrl }: MobileOnboardingProps) {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-brand style-mobile-body text-ink antialiased">
      {/* Top Header / Brand Hero Section */}
      <header className="relative flex w-full flex-col bg-cream pb-20 pt-8 sm:pt-12">
        <div className="mx-auto flex w-full max-w-[430px] flex-col items-center px-6">
          <Link href="/events">
            <img
              className="h-12 w-auto shrink-0 object-contain sm:h-14"
              src="/ais_logo_black.png"
              alt="AIS Logo"
            />
          </Link>
          <h1 className="mt-6 text-center font-mobile-display text-3xl font-extrabold leading-[1.15] tracking-tight text-ink sm:text-4xl">
            Step into the world of <span className="text-brand">artificial intelligence</span>
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-6 pb-8">
        {/* Auth Card overlapping cream header */}
        <div className="relative z-10 -mt-12 w-full rounded-2xl shadow-lg">
          <AuthCard redirectUrl={redirectUrl} />
        </div>

        {/* Community Link / Discord Footer */}
        <footer className="mt-auto flex w-full justify-center pt-8">
          <Link
            href="https://discord.gg/JFEkPHjzEK"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              variant="accent"
              size="md"
              className="w-full gap-2 font-medium opacity-95 transition-all hover:opacity-100 sm:w-auto"
            >
              Join Discord ↗
            </Button>
          </Link>
        </footer>
      </main>
    </div>
  );
}

export function MobileOnboarding({ redirectUrl }: MobileOnboardingProps) {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] w-full bg-brand" />}>
      <MobileOnboardingInner redirectUrl={redirectUrl} />
    </Suspense>
  );
}