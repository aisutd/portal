"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";

function AuthCardInner() {
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

  const goToSetup = () => router.push("/onboarding/setup");
  const goToDashboard = () => router.push("/dashboard");

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) {
      console.error("signUp.password error:", error);
      setErrorMessage(error.longMessage ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    const { error: codeError } = await signUp.verifications.sendEmailCode();
    if (codeError) {
      console.error("signUp.password error:", error);
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
      console.error("signUp.password error:", error); // ADD THIS
      setErrorMessage("That code didn't work — double-check it and try again.");
      setSubmitting(false);
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize({ navigate: goToSetup });
    } else {
      console.error("signUp.password error:", error); // ADD THIS
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
      console.error("signUp.password error:", error); // ADD THIS
      setErrorMessage("Incorrect email or password.");
      setSubmitting(false);
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: goToDashboard });
    } else {
      // MFA / other session steps aren't wired up yet — fine as long as
      // you haven't enabled a second factor in the Clerk Dashboard
      setErrorMessage("Additional verification is required, which isn't supported yet.");
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="relative h-[500px] w-full max-w-[400px] rounded-[14px] bg-white shadow-auth-card">
        <div className="absolute left-[30px] right-[30px] top-[30px] pt-[17px]">
          <h2 className="font-chakra text-[23px] font-bold leading-[normal] text-ink-card">
            Check your email
          </h2>
        </div>

        <form onSubmit={handleVerifySubmit}>
          <div className="absolute left-[30px] right-[30px] top-[134px]">
            <Field
              label="Verification code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {errorMessage && (
            <p className="absolute left-[30px] right-[30px] top-[210px] text-[12px] text-red-600">
              {errorMessage}
            </p>
          )}

          <div className="absolute left-[30px] right-[30px] top-[325px]">
            <Button variant="auth" block type="submit" disabled={submitting}>
              {submitting ? "Verifying…" : "Verify email"}
            </Button>
          </div>
        </form>

        <div className="absolute left-[30px] right-[30px] top-[388px] text-center">
          <p className="font-mono-alt text-[11px] leading-[normal] text-helper-ink">
            we sent a 6-digit code to {email}
          </p>
        </div>
      </div>
    );
  }

  const isSignUp = tab === "Sign up";

  return (
    <div className="relative h-[500px] w-full max-w-[400px] rounded-[14px] bg-white shadow-auth-card">
      <div className="absolute left-[30px] right-[30px] top-[30px]">
        <SegmentedTabs
          options={["Sign up", "Log in"]}
          value={tab}
          onChange={(v) => setTab(v as "Sign up" | "Log in")}
        />
      </div>

      <div className="absolute left-[30px] right-[30px] top-[80px] pt-[17px]">
        <h2 className="font-chakra text-[23px] font-bold leading-[normal] text-ink-card">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h2>
      </div>

      <form onSubmit={isSignUp ? handleSignUpSubmit : handleLoginSubmit}>
        <div className="absolute left-[30px] right-[30px] top-[134px]">
          <Field
            label="UTD Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="netid@utdallas.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="absolute left-[30px] right-[30px] top-[224px]">
          <Field
            label="Password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {errorMessage && (
          <p className="absolute left-[30px] right-[30px] top-[300px] text-[12px] text-red-600">
            {errorMessage}
          </p>
        )}

        <div id="clerk-captcha" />

        <div className="absolute left-[30px] right-[30px] top-[325px]">
          <Button variant="auth" block type="submit" disabled={submitting}>
            {submitting ? "…" : isSignUp ? "Create Account" : "Log In"}
          </Button>
        </div>
      </form>

      <div className="absolute left-[30px] right-[30px] top-[388px] text-center">
        <p className="font-mono-alt text-[11px] leading-[normal] text-helper-ink">
          {isSignUp ? "we'll email you a 6-digit code to verify your account" : "welcome back to AIS"}
        </p>
      </div>
    </div>
  );
}

export function AuthCard() {
  // useSearchParams() requires a Suspense boundary
  return (
    <Suspense fallback={<div className="h-[500px] w-full max-w-[400px] rounded-[14px] bg-white shadow-auth-card" />}>
      <AuthCardInner />
    </Suspense>
  );
}