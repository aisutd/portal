"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileField } from "@/components/mobile/ui/MobileField";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { MobileEyebrow as Eyebrow } from "@/components/mobile/ui/MobileEyebrow";
import { SignOutButton } from "@clerk/nextjs";
import { PasswordResetButton } from "@/components/profile/PasswordResetButton";
import { ResumeUploadButton } from "@/components/profile/ResumeUploadButton";
import { UTD_MAJORS, UTD_DEGREES, ACADEMIC_YEARS } from "@/lib/utd-data";

type MobileProfileProps = {
  profile: Profile & { resumeFile?: { fileName: string } | null };
  completion: { percent: number; missingFields: string[] };
  updateProfile: (formData: FormData) => Promise<void>;
};

function MobileSelect({
  label,
  name,
  defaultValue,
  options,
  className,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="style-label-text text-ink">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className={cn(
          "w-full rounded-[10px] border border-transparent bg-field px-[13px] py-[11px] style-mobile-body text-ink focus:outline-none focus:ring-2 focus:ring-brand/40",
          className
        )}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MobileProfile({ profile, completion, updateProfile }: MobileProfileProps) {
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
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMessage(error?.message || "Something went wrong. Please try again.");
      }
    });
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  return (
    <MobileScreen>
      {completion.percent < 100 && (
        <div className="rounded-[8px] bg-[#f9d5d3] px-[16px] py-[12px]">
          <span className="style-mobile-body font-bold text-[#9a3b36]">
            Your profile is {completion.percent}% complete. Fill in the highlighted fields to
            reach 100%.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-red-100 p-3 text-xs font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <form key={profile.updatedAt.toString()} onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
        {/* Name / Major bar */}
        <Card className="flex flex-row flex-wrap items-center justify-between gap-[10px] p-[18px]">
          <p className="style-card-title uppercase tracking-[0.5px] text-ink">
            {profile.firstName} {profile.lastName}
          </p>
          <Badge
            label={`${profile.major || "No Major"} · ${profile.year || "N/A"}`}
            bg="#fbe3cb"
            color="#7a4416"
          />
        </Card>

        {/* Links */}
        <Card className="flex flex-col gap-[12px] p-[16px]">
          <Eyebrow>Links</Eyebrow>
          <MobileField
            label="LinkedIn"
            name="linkedinUrl"
            defaultValue={profile.linkedinUrl || ""}
            placeholder="linkedin.com/in/…"
            className={cn(!profile.linkedinUrl ? "border-red-500 bg-red-50 ring-2 ring-red-500" : "border-transparent")}
          />
          <MobileField
            label="Github"
            name="githubUrl"
            defaultValue={profile.githubUrl || ""}
            placeholder="github.com/…"
            className={cn(!profile.githubUrl ? "border-red-500 bg-red-50 ring-2 ring-red-500" : "border-transparent")}
          />
          <MobileField
            label="Portfolio"
            name="portfolioUrl"
            defaultValue={profile.portfolioUrl || ""}
            placeholder="https://..."
            className="border-transparent"
          />
        </Card>

        {/* Personal Info */}
        <Card className="flex flex-col gap-[14px] p-[18px]">
          <Eyebrow>Personal Info</Eyebrow>
          <MobileField label="First Name" name="firstName" defaultValue={profile.firstName} />
          <MobileField label="Last Name" name="lastName" defaultValue={profile.lastName} />
          <MobileField label="Preferred Name" name="prefName" defaultValue={profile.prefName || ""} />
          <MobileField
            label="Email"
            name="utdEmail"
            type="email"
            defaultValue={profile.utdEmail || ""}
          />
          <MobileField
            label="UTD ID"
            name="utdNetId"
            defaultValue={profile.utdNetId || ""}
            className={cn(!profile.utdNetId ? "border-red-500 bg-red-50 ring-2 ring-red-500" : "border-transparent")}
          />
          <MobileSelect
            label="Major"
            name="major"
            defaultValue={profile.major ?? ""}
            options={UTD_MAJORS}
            className={cn(!profile.major ? "border-red-500 bg-red-50 ring-2 ring-red-500" : "border-transparent")}
          />
          <MobileSelect
            label="Degree"
            name="degree"
            defaultValue={profile.degree ?? ""}
            options={UTD_DEGREES}
            className={cn(!profile.degree ? "border-red-500 bg-red-50 ring-2 ring-red-500" : "border-transparent")}
          />
          <MobileSelect
            label="Academic Year"
            name="year"
            defaultValue={profile.year ?? ""}
            options={ACADEMIC_YEARS}
            className={cn(!profile.year ? "border-red-500 bg-red-50 ring-2 ring-red-500" : "border-transparent")}
          />
        </Card>

        {/* Resume Upload */}
        <Card
          className={cn(
            "flex flex-col gap-[12px] p-[18px]",
            !profile.resumeFileId && "border-2 border-red-500 bg-red-50/50"
          )}
        >
          <Eyebrow>Resume Upload</Eyebrow>
          <ResumeUploadButton
            initialFileName={profile.resumeFile?.fileName}
            hasResume={!!profile.resumeFileId}
          />
        </Card>

        {/* Security */}
        <Card className="flex flex-col gap-[16px] p-[18px]">
          <Eyebrow>Security</Eyebrow>

          <div className="flex items-center justify-between gap-[12px] rounded-[12px] bg-row-soft p-[14px]">
            <div>
              <p className="style-card-title text-ink">Change Password</p>
              <p className="style-body-text text-ink-muted">
                Update your account password
              </p>
            </div>
            <PasswordResetButton />
          </div>
        </Card>

        {/* Footer actions */}
        <div className="flex gap-[12px]">
          <Button
            type="button"
            variant="soft"
            className="flex-1"
            block
            disabled={isPending}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            block
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Apply Changes"}
          </Button>
        </div>
      </form>

      <div className="mt-2 flex w-full items-center pb-16">
        <SignOutButton redirectUrl="/">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={isPending}
            className="mr-auto font-black text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Sign Out
          </Button>
        </SignOutButton>
      </div>

      {/* MOBILE SUCCESS MODAL POPUP */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl flex flex-col items-center text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="style-card-title text-ink">Changes Saved!</h3>
              <p className="style-body-text text-ink-muted text-xs">
                Your profile details have been successfully updated.
              </p>
            </div>

            <div className="mt-2 flex w-full flex-col gap-2">
              <Button
                type="button"
                variant="primary"
                className="w-full font-bold"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full font-bold text-xs"
                onClick={() => setShowSuccessModal(false)}
              >
                Keep Editing
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </MobileScreen>
  );
}