"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";
import { updateProfile } from "@/app/profile/actions";

interface ProfileFormProps {
  children: React.ReactNode;
  initialUpdatedAt: string;
}

export function ProfileForm({ children, initialUpdatedAt }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateProfile(formData);
        setShowSuccessModal(true);
      } catch (err: any) {
        setErrorMessage(err?.message || "Something went wrong. Please try again.");
      }
    });
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  return (
    <>
      <form key={initialUpdatedAt} onSubmit={handleSubmit} className="mt-[28px] flex flex-col gap-[24px]">
        {errorMessage && (
          <div className="rounded-lg bg-red-100 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {children}

        {/* Action Buttons */}
        <div className="mt-auto flex items-center justify-end gap-[16px] pt-[16px]">
          <SignOutButton redirectUrl="/">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={isPending}
              className="mr-auto px-[32px] font-black text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Sign Out
            </Button>
          </SignOutButton>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={isPending}
            onClick={handleCancel}
            className="px-[32px] font-black"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isPending}
            className="px-[32px] font-black"
          >
            {isPending ? "Saving..." : "Apply Changes"}
          </Button>
        </div>
      </form>

      {/* SUCCESS MODAL POPUP */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col items-center text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="style-card-title text-ink">Changes Saved!</h3>
              <p className="style-body-text text-ink-muted text-sm">
                Your profile details have been successfully updated.
              </p>
            </div>

            <div className="mt-2 flex w-full gap-3">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 font-bold"
                onClick={() => setShowSuccessModal(false)}
              >
                Keep Editing
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1 font-bold"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}