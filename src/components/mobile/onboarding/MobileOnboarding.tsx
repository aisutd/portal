"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";

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
    <div className="flex min-h-screen flex-col bg-cream font-mobile-body text-ink">
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col">
        {/* Cream header */}
        <div className="flex flex-col gap-[12px] px-[24px] pb-[90px] pt-[32px]">
          <p className="font-mobile-display text-[12px] font-bold uppercase tracking-[1.5px] text-brand">
            Artificial Intelligence Society
          </p>
          <h1 className="font-mobile-display text-[26px] font-bold leading-[32px] text-ink">
            Step into the world of{" "}
            <span className="text-brand">artificial intelligence</span>
          </h1>
        </div>

        {/* Blue lower panel with overlapping card */}
        <div className="flex flex-1 flex-col items-center gap-[24px] bg-brand px-[20px] pb-[40px] pt-[36px]">
          <div className="-mt-[76px] w-full rounded-[16px] bg-white p-[24px] shadow-auth-card">
            {verifying ? (
              <>
                <h2 className="font-mobile-display text-[19px] font-bold text-ink-card">
                  Check your email
                </h2>

                <form onSubmit={handleVerifySubmit} className="mt-[16px] flex flex-col gap-[14px]">
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
                    <p className="text-[12px] text-red-600">{errorMessage}</p>
                  )}

                  <Button variant="auth" block type="submit" disabled={submitting}>
                    {submitting ? "Verifying…" : "Verify email"}
                  </Button>
                </form>

                <p className="mt-[12px] text-center font-mono-alt text-[11px] text-helper-ink">
                  we sent a 6-digit code to {email}
                </p>
              </>
            ) : (
              <>
                <SegmentedTabs
                  options={["Sign up", "Log in"]}
                  value={tab}
                  onChange={(v) => setTab(v as "Sign up" | "Log in")}
                />

                <h2 className="mt-[20px] font-mobile-display text-[19px] font-bold text-ink-card">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h2>

                <form
                  onSubmit={isSignUp ? handleSignUpSubmit : handleLoginSubmit}
                  className="mt-[16px] flex flex-col gap-[14px]"
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
                    <p className="text-[12px] text-red-600">{errorMessage}</p>
                  )}

                  <div id="clerk-captcha" />

                  <Button variant="auth" block type="submit" disabled={submitting}>
                    {submitting ? "…" : isSignUp ? "Create Account" : "Log In"}
                  </Button>
                </form>

                <p className="mt-[12px] text-center font-mono-alt text-[11px] text-helper-ink">
                  {isSignUp
                    ? "we'll email you a 6-digit code to verify your account"
                    : "welcome back to AIS"}
                </p>
              </>
            )}
          </div>

          <Button variant="accent" size="lg">
            Join Discord ↗
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MobileOnboarding() {
  // useSearchParams() requires a Suspense boundary
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <MobileOnboardingInner />
    </Suspense>
  );
}
