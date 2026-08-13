"use client";
//TODO - Make what is required at profile creation consistent accross api and this doc's canNext()
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormStepper } from "@/components/apply/form-stepper";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = ["Personal", "Academic", "Links"];
const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];
const DEGREES = ["Bachelors", "Masters", "PhD"];

function SelectArrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none absolute right-[13px] top-1/2 size-[16px] -translate-y-1/2 text-ink-muted"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ProfileWizardProps = {
  email: string;
};

export function ProfileWizard({ email }: ProfileWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUtdEmail = email.endsWith("@utdallas.edu");
  const derivedNetId = isUtdEmail ? email.split("@")[0] : "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    prefName: "",
    year: "",
    degree: "",
    major: "",
    utdEmail: isUtdEmail ? email : "",
    utdNetId: derivedNetId,
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const canNext = () => {
    if (step === 0)
      return (
        form.firstName.trim() && form.lastName.trim() // && form.prefName.trim()
      );
    if (step === 1) return form.utdNetId // && form.year && form.degree && form.major.trim();
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const selectClasses = cn(
    "w-full appearance-none rounded-[7px] border border-transparent bg-field py-[12px] pl-[13px] pr-[36px]",
    "font-mono-alt text-[13px] leading-[normal] text-ink-card",
    "focus:outline-none focus:ring-2 focus:ring-brand/40"
  );

  return (
    <div>
      <FormStepper steps={STEPS} active={step} onDark />

      <div className="mt-[20px] rounded-2xl border border-border-soft bg-white p-[30px]">
        {/* Step 1 — Personal */}
        {step === 0 && (
          <div className="flex flex-col gap-[16px]">
            <Field
              label="First Name"
              value={form.firstName}
              onChange={set("firstName")}
              placeholder="Ada"
              required
            />
            <Field
              label="Last Name"
              value={form.lastName}
              onChange={set("lastName")}
              placeholder="Lovelace"
              required
            />
            <Field
              label="Middle Name (optional)"
              value={form.middleName}
              onChange={set("middleName")}
              placeholder=""
            />
            <Field
              label="Preferred Name"
              value={form.prefName}
              onChange={set("prefName")}
              placeholder="Ada"
            />
          </div>
        )}

        {/* Step 2 — Academic */}
        {step === 1 && (
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-col">
              <label className="mb-[10px] font-grotesk text-[13px] font-semibold leading-[normal] text-label-ink">
                Year
              </label>
              <div className="relative">
                <select
                  value={form.year}
                  onChange={set("year")}
                  className={selectClasses}
                >
                  <option value="">Select year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-[10px] font-grotesk text-[13px] font-semibold leading-[normal] text-label-ink">
                Degree
              </label>
              <div className="relative">
                <select
                  value={form.degree}
                  onChange={set("degree")}
                  className={selectClasses}
                >
                  <option value="">Select degree</option>
                  {DEGREES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
            </div>

            <Field
              label="Major"
              value={form.major}
              onChange={set("major")}
              placeholder="Computer Science"
            />
            <Field
              label="UTD Email"
              value={form.utdEmail}
              onChange={set("utdEmail")}
              placeholder="netid@utdallas.edu"
              readOnly={isUtdEmail}
              className={isUtdEmail ? "opacity-60" : ""}
            />
            <Field
              label="UTD Net ID"
              value={form.utdNetId}
              onChange={set("utdNetId")}
              placeholder="abc123456"
              required
            />
          </div>
        )}

        {/* Step 3 — Links */}
        {step === 2 && (
          <div className="flex flex-col gap-[16px]">
            <p className="font-body text-[14px] leading-[20.3px] text-ink-muted">
              These are all optional — you can always add them later from your
              profile.
            </p>
            <Field
              label="GitHub URL"
              value={form.githubUrl}
              onChange={set("githubUrl")}
              placeholder="https://github.com/username"
            />
            <Field
              label="LinkedIn URL"
              value={form.linkedinUrl}
              onChange={set("linkedinUrl")}
              placeholder="https://linkedin.com/in/username"
            />
            <Field
              label="Portfolio URL"
              value={form.portfolioUrl}
              onChange={set("portfolioUrl")}
              placeholder="https://yoursite.com"
            />
          </div>
        )}

        {error && (
          <p className="mt-[12px] text-[12px] text-red-600">{error}</p>
        )}

        {/* Navigation */}
        <div className="mt-[24px] flex items-center justify-between">
          {step > 0 ? (
            <Button variant="primary" size="sm" type="button" onClick={back}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <Button
              variant="auth"
              type="button"
              onClick={next}
              disabled={!canNext()}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="auth"
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Complete Profile"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
