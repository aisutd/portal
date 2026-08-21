"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import Link from 'next/link'

function MobileOnboardingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("mode") === "login" ? "Log in" : "Sign up";

  const [tab, setTab] = useState<"Sign up" | "Log in">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { signUp } = useSignUp();
  const { signIn } = useSignIn();

  const goToDashboard = () => router.push("/dashboard");

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) {
      setErrorMessage(error.longMessage ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    const { error: codeError } = await signUp.verifications.sendEmailCode();
    if (codeError) {
      setErrorMessage("Couldn't send a verification code. Please try again.");
      setSubmitting(false);
      return;
    }

    setVerifying(true);
    setSubmitting(false);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      setErrorMessage("That code didn't work — double-check it and try again.");
      setSubmitting(false);
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize({ navigate: goToDashboard });
    } else {
      setErrorMessage("Couldn't complete sign-up. Please try again.");
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await signIn.password({ identifier: email, password });
    if (error) {
      setErrorMessage("Incorrect email or password.");
      setSubmitting(false);
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: goToDashboard });
    } else {
      setErrorMessage("Additional verification is required, which isn't supported yet.");
      setSubmitting(false);
    }
  };

  const isSignUp = tab === "Sign up";

  return (
    // min-h-[100dvh] allows scrolling when the mobile keyboard is active
    // bg-brand acts as the bottom half color naturally
    <div className="flex min-h-[100dvh] w-full flex-col bg-brand font-mobile-body text-ink">
      
      {/* Top Cream Section */}
      <div className="flex w-full flex-col bg-cream pb-[5.5rem] pt-10 sm:pt-12">
        <div className="mx-auto flex w-full max-w-[430px] flex-col items-start px-6">
          <img
            className="h-14 shrink-0 object-contain"
            src="/ais_logo_black.png"
            alt="AIS Logo"
          />
          <h1 className="mt-4 text-left font-sans text-[28px] font-bold leading-[1.1] text-ink sm:text-[32px]">
            Step into the<br />
            world of <span className="text-brand">artificial</span><br />
            <span className="text-brand">intelligence</span>
          </h1>
        </div>
      </div>

      {/* Bottom Content Area */}
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-6 pb-8">
        
        {/* Auth Card - Pulled up into the cream section using negative margin */}
        <main className="relative z-10 -mt-12 w-full rounded-[24px] border border-border-soft bg-white p-6 shadow-xl shadow-brand/10 sm:p-8">
          {verifying ? (
            <>
              <div className="text-center">
                <h2 className="font-sans text-xl font-bold text-ink-card sm:text-2xl">
                  Check your email
                </h2>
                <p className="mt-2 font-sans text-sm font-normal text-ink-muted">
                  We sent a 6-digit code to <br />
                  <span className="font-medium text-ink">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="mt-7 flex flex-col gap-5">
                <Field
                  label="Verification code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                
                {errorMessage && (
                  <div className="rounded-xl bg-red-50 p-3.5">
                    <p className="text-sm font-medium text-red-600">{errorMessage}</p>
                  </div>
                )}
                
                <div className="pt-2">
                  <Button variant="auth" block type="submit" disabled={submitting}>
                    {submitting ? "Verifying…" : "Verify email"}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <SegmentedTabs
                options={["Sign up", "Log in"]}
                value={tab}
                onChange={(v) => setTab(v as "Sign up" | "Log in")}
              />
              
              <h2 className="mt-7 font-sans text-[20px] font-bold text-ink-card">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>
              
              <form
                onSubmit={isSignUp ? handleSignUpSubmit : handleLoginSubmit}
                className="mt-5 flex flex-col gap-5"
              >
                <Field
                  label="UTD Email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="netid@utdallas.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Field
                  label="Password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
                {errorMessage && (
                  <div className="rounded-xl bg-red-50 p-3.5">
                    <p className="text-sm font-medium text-red-600">{errorMessage}</p>
                  </div>
                )}
                
                <div id="clerk-captcha" />
                
                <div className="pt-2">
                  <Button variant="auth" block type="submit" disabled={submitting}>
                    {submitting ? "Working..." : isSignUp ? "Create Account" : "Log In"}
                  </Button>
                </div>
              </form>
              
              <p className="mt-5 text-center font-mono text-xs text-ink-faint sm:text-[13px]">
                {isSignUp
                  ? "We'll email you a 6-digit code to verify your account"
                  : "Welcome back to AIS"}
              </p>
            </>
          )}
        </main>

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