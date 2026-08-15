"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { toFieldErrors, type AuthField, type AuthFieldErrors } from "@/lib/clerk-errors";
import { EMAIL_DOMAIN_ERROR, isAllowedEmail } from "@/lib/email-domains";

/**
 * Card shell. Laid out in flow rather than absolutely so a validation message can
 * grow to a few lines without running through the submit button; the margins and
 * reserved min-heights below reproduce the Figma spacing when nothing is showing.
 */
const CARD =
  "flex min-h-[500px] w-full max-w-[400px] flex-col rounded-[14px] bg-white p-[30px] shadow-auth-card";

/** Red validation text rendered directly beneath the field it belongs to. */
function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-[8px] font-body text-[12px] leading-[16.8px] text-red-600"
    >
      {message}
    </p>
  );
}

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
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const { signUp } = useSignUp();
  const { signIn } = useSignIn();

  const goToSetup = () => router.push("/onboarding/setup");
  const goToDashboard = () => router.push("/dashboard");

  /** Drop a field's error once the user starts fixing it. */
  const clearError = (field: AuthField) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      delete next.form;
      return next;
    });

  const handleSignUpSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signUp) return;
    setSubmitting(true);
    setFieldErrors({});

    // Membership is UTD/AIS only. Enforced again server-side — see email-domains.ts.
    if (!isAllowedEmail(email)) {
      setFieldErrors({ email: EMAIL_DOMAIN_ERROR });
      setSubmitting(false);
      return;
    }

    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) {
      console.error("signUp.password error:", error);
      setFieldErrors(
        toFieldErrors(error, "Something went wrong. Please try again.")
      );
      setSubmitting(false);
      return;
    }

    const { error: codeError } = await signUp.verifications.sendEmailCode();
    if (codeError) {
      console.error("signUp.verifications.sendEmailCode error:", codeError);
      setFieldErrors(
        toFieldErrors(
          codeError,
          "Couldn't send a verification code. Please try again."
        )
      );
      setSubmitting(false);
      return;
    }

    setVerifying(true);
    setSubmitting(false);
  };

  const handleVerifySubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signUp) return;
    setSubmitting(true);
    setFieldErrors({});

    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      console.error("signUp.verifications.verifyEmailCode error:", error);
      setFieldErrors(
        toFieldErrors(
          error,
          "That code didn't work — double-check it and try again."
        )
      );
      setSubmitting(false);
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize({ navigate: goToSetup });
    } else {
      console.error("signUp status after verification:", signUp.status);
      setFieldErrors({ form: "Couldn't complete sign-up. Please try again." });
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signIn) return;
    setSubmitting(true);
    setFieldErrors({});

    if (!isAllowedEmail(email)) {
      setFieldErrors({ email: EMAIL_DOMAIN_ERROR });
      setSubmitting(false);
      return;
    }

    const { error } = await signIn.password({ identifier: email, password });
    if (error) {
      console.error("signIn.password error:", error);
      setFieldErrors(toFieldErrors(error, "Incorrect email or password."));
      setSubmitting(false);
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: goToDashboard });
    } else {
      // MFA / other session steps aren't wired up yet — fine as long as
      // you haven't enabled a second factor in the Clerk Dashboard
      setFieldErrors({
        form: "Additional verification is required, which isn't supported yet.",
      });
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className={CARD}>
        <h2 className="mt-[17px] font-chakra text-[23px] font-bold leading-[normal] text-ink-card">
          Check your email
        </h2>

        <form onSubmit={handleVerifySubmit} className="flex flex-col">
          {/* Reserves the gap down to the button so short errors don't shift it. */}
          <div className="mt-[59px] min-h-[191px]">
            <Field
              label="Verification code"
              id="auth-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                clearError("code");
              }}
              aria-invalid={Boolean(fieldErrors.code)}
              aria-describedby={fieldErrors.code ? "auth-code-error" : undefined}
            />
            <ErrorText id="auth-code-error" message={fieldErrors.code} />
            <ErrorText id="auth-form-error" message={fieldErrors.form} />
          </div>

          <Button variant="auth" block type="submit" disabled={submitting}>
            {submitting ? "Verifying…" : "Verify email"}
          </Button>
        </form>

        <p className="mt-[16px] text-center font-mono-alt text-[11px] leading-[normal] text-helper-ink">
          we sent a 6-digit code to {email}
        </p>
      </div>
    );
  }

  const isSignUp = tab === "Sign up";

  return (
    <div className={CARD}>
      <SegmentedTabs
        options={["Sign up", "Log in"]}
        value={tab}
        onChange={(v) => {
          setTab(v as "Sign up" | "Log in");
          setFieldErrors({});
        }}
      />

      <h2 className="mt-[25px] font-chakra text-[23px] font-bold leading-[normal] text-ink-card">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h2>

      <form
        onSubmit={isSignUp ? handleSignUpSubmit : handleLoginSubmit}
        className="flex flex-col"
      >
        {/* Reserves the gap down to the password field. */}
        <div className="mt-[9px] min-h-[90px]">
          <Field
            label="UTD Email"
            id="auth-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="netid@utdallas.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
          />
          <ErrorText id="auth-email-error" message={fieldErrors.email} />
        </div>

        {/* Reserves the gap down to the button so short errors don't shift it. */}
        <div className="min-h-[101px]">
          <Field
            label="Password"
            id="auth-password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "auth-password-error" : undefined
            }
          />
          <ErrorText id="auth-password-error" message={fieldErrors.password} />
          <ErrorText id="auth-form-error" message={fieldErrors.form} />
        </div>

        <div id="clerk-captcha" />

        <Button variant="auth" block type="submit" disabled={submitting}>
          {submitting ? "…" : isSignUp ? "Create Account" : "Log In"}
        </Button>
      </form>

      <p className="mt-[16px] text-center font-mono-alt text-[11px] leading-[normal] text-helper-ink">
        {isSignUp
          ? "we'll email you a 6-digit code to verify your account"
          : "welcome back to AIS"}
      </p>
    </div>
  );
}

export function AuthCard() {
  // useSearchParams() requires a Suspense boundary
  return (
    <Suspense
      fallback={
        <div className="h-[500px] w-full max-w-[400px] rounded-[14px] bg-white shadow-auth-card" />
      }
    >
      <AuthCardInner />
    </Suspense>
  );
}
