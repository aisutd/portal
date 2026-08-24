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

/** Small centred link used for the secondary actions under a card's button. */
const CARD_LINK = "font-mono-alt leading-[normal] hover:underline";

/**
 * Which screen the card is showing. Sign-up verification and password reset are
 * full-card takeovers rather than extra fields on the tabbed form.
 */
type View = "form" | "verify-signup" | "reset-request" | "reset-code";

/** Red validation text rendered directly beneath the field it belongs to. */
function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-[8px] style-body-text leading-[16.8px] text-red-600"
    >
      {message}
    </p>
  );
}

function AuthCardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");

  const initialTab = mode === "login" || mode === "reset" ? "Log in" : "Sign up";

  const [tab, setTab] = useState<"Sign up" | "Log in">(initialTab);
  const [view, setView] = useState<View>(mode === "reset" ? "reset-request" : "form");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const { signUp } = useSignUp();
  const { signIn } = useSignIn();

  const goToSetup = () => router.push("/onboarding/setup");
  const goToDashboard = () => router.push("/dashboard");

  const clearError = (field: AuthField) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      delete next.form;
      return next;
    });

  const clearResetState = () => {
    setCode("");
    setNewPassword("");
    setCodeVerified(false);
    setNotice("");
    setFieldErrors({});
  };

  const openReset = () => {
    clearResetState();
    setView("reset-request");
  };

  const backToLogin = async () => {
    clearResetState();
    setView("form");
    setTab("Log in");
    await signIn?.reset();
  };

  const handleSignUpSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signUp) return;
    setSubmitting(true);
    setFieldErrors({});

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

    setView("verify-signup");
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
      setFieldErrors({
        form: "Additional verification is required, which isn't supported yet.",
      });
      setSubmitting(false);
    }
  };

  const sendResetCode = async () => {
    if (!signIn) return false;

    const { error: createError } = await signIn.create({ identifier: email });
    if (createError) {
      console.error("signIn.create error:", createError);
      setFieldErrors(
        toFieldErrors(createError, "We couldn't find an account with that email.")
      );
      return false;
    }

    const { error } = await signIn.resetPasswordEmailCode.sendCode();
    if (error) {
      console.error("signIn.resetPasswordEmailCode.sendCode error:", error);
      setFieldErrors(
        toFieldErrors(error, "Couldn't send a reset code. Please try again.")
      );
      return false;
    }

    return true;
  };

  const handleResetRequestSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!signIn) return;
    setSubmitting(true);
    setFieldErrors({});
    setNotice("");

    if (!isAllowedEmail(email)) {
      setFieldErrors({ email: EMAIL_DOMAIN_ERROR });
      setSubmitting(false);
      return;
    }

    if (await sendResetCode()) {
      setView("reset-code");
    }
    setSubmitting(false);
  };

  const handleResendResetCode = async () => {
    if (!signIn) return;
    setSubmitting(true);
    setFieldErrors({});
    setNotice("");
    setCode("");
    setCodeVerified(false);

    if (await sendResetCode()) {
      setNotice(`New code sent to ${email}`);
    }
    setSubmitting(false);
  };

  const handleResetSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signIn) return;
    setSubmitting(true);
    setFieldErrors({});
    setNotice("");

    if (!codeVerified) {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (error) {
        console.error("signIn.resetPasswordEmailCode.verifyCode error:", error);
        setFieldErrors(
          toFieldErrors(
            error,
            "That code didn't work — double-check it and try again."
          )
        );
        setSubmitting(false);
        return;
      }
      setCodeVerified(true);
    }

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password: newPassword,
      signOutOfOtherSessions: true,
    });
    if (error) {
      console.error("signIn.resetPasswordEmailCode.submitPassword error:", error);
      setFieldErrors(
        toFieldErrors(error, "Couldn't set that password. Please try another one.")
      );
      setSubmitting(false);
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: goToDashboard });
    } else {
      console.error("signIn status after password reset:", signIn.status);
      setFieldErrors({
        form: "Additional verification is required, which isn't supported yet.",
      });
      setSubmitting(false);
    }
  };

  if (view === "verify-signup") {
    return (
      <div className={CARD}>
        <h2 className="mt-[17px] font-chakra font-bold leading-[normal] text-ink-card">
          Check your email
        </h2>

        <form onSubmit={handleVerifySubmit} className="flex flex-col">
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

        <p className="mt-[16px] text-center font-mono-alt leading-[normal] text-helper-ink">
          We sent a 6-digit code to {email}
        </p>
      </div>
    );
  }

  if (view === "reset-request") {
    return (
      <div className={CARD}>
        <h2 className="mt-[17px] font-chakra font-bold leading-[normal] text-ink-card">
          Reset your password
        </h2>
        <p className="mt-[8px] style-body-text leading-[19px] text-ink-muted">
          We&apos;ll email you a 6-digit code to set a new password.
        </p>

        <form onSubmit={handleResetRequestSubmit} className="flex flex-col">
          <div className="mt-[36px] min-h-[170px]">
            <Field
              label="UTD Email"
              id="reset-email"
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
              aria-describedby={
                fieldErrors.email ? "reset-email-error" : undefined
              }
            />
            <ErrorText id="reset-email-error" message={fieldErrors.email} />
            <ErrorText id="reset-form-error" message={fieldErrors.form} />
          </div>

          <Button variant="auth" block type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset code"}
          </Button>
        </form>

        <button
          type="button"
          onClick={backToLogin}
          className={`mt-[16px] text-center text-brand ${CARD_LINK}`}
        >
          ← Back to log in
        </button>
      </div>
    );
  }

  if (view === "reset-code") {
    return (
      <div className={CARD}>
        <h2 className="mt-[17px] font-chakra font-bold leading-[normal] text-ink-card">
          Choose a new password
        </h2>
        <p className="mt-[8px] style-body-text leading-[19px] text-ink-muted">
          Enter the code we sent to {email}, then pick a new password.
        </p>

        <form onSubmit={handleResetSubmit} className="flex flex-col">
          <div className="mt-[24px] min-h-[100px]">
            <Field
              label="Reset code"
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                clearError("code");
              }}
              disabled={codeVerified}
              aria-invalid={Boolean(fieldErrors.code)}
              aria-describedby={fieldErrors.code ? "reset-code-error" : undefined}
            />
            <ErrorText id="reset-code-error" message={fieldErrors.code} />
            {notice && (
              <p
                role="status"
                className="mt-[8px] style-body-text leading-[16.8px] text-green"
              >
                {notice}
              </p>
            )}
          </div>

          <div className="min-h-[101px]">
            <Field
              label="New password"
              id="reset-new-password"
              showToggle
              autoComplete="new-password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                clearError("password");
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "reset-password-error" : undefined
              }
            />
            <ErrorText id="reset-password-error" message={fieldErrors.password} />
            <ErrorText id="reset-form-error" message={fieldErrors.form} />
          </div>

          <Button variant="auth" block type="submit" disabled={submitting}>
            {submitting ? "…" : "Reset password"}
          </Button>
        </form>

        <div className="mt-[16px] flex flex-col items-center gap-[10px]">
          <button
            type="button"
            onClick={handleResendResetCode}
            disabled={submitting}
            className={`text-brand disabled:opacity-50 ${CARD_LINK}`}
          >
            Didn&apos;t get it? Send a new code
          </button>
          <button
            type="button"
            onClick={backToLogin}
            className={`text-helper-ink ${CARD_LINK}`}
          >
            ← Back to log in
          </button>
        </div>
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

      <h2 className="mt-6 leading-[normal] text-display text-xl text-ink-card">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h2>

      <form
        onSubmit={isSignUp ? handleSignUpSubmit : handleLoginSubmit}
        className="flex flex-col"
      >
        <div className="mt-6 min-h-[90px]">
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

        <div className="min-h-[101px]">
          <Field
            label="Password"
            id="auth-password"
            showToggle
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

          {!isSignUp && (
            <div className="mt-4 mb-6 flex justify-end">
              <button
                type="button"
                onClick={openReset}
                className={`text-brand text-sm ${CARD_LINK}`}
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        <div id="clerk-captcha" />

        <Button variant="auth" block type="submit" disabled={submitting}>
          {submitting ? "…" : isSignUp ? "Create Account" : "Log In"}
        </Button>
      </form>

      <p className="mt-4 text-center font-mono-alt text-xs leading-[normal] text-helper-ink">
        {isSignUp
          ? "we'll email you a 6-digit code to verify your account"
          : "welcome back to AIS"}
      </p>
    </div>
  );
}

export function AuthCard() {
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