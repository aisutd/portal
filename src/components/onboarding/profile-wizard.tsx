"use client";
//TODO - Make what is required at profile creation consistent across api and this doc's canNext()
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormStepper } from "@/components/apply/form-stepper";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UTD_DEGREES, UTD_MAJORS, ACADEMIC_YEARS } from "@/lib/utd-data";

const STEPS = ["Personal", "Academic", "Links"];
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
    } catch (err) {
    console.error("Profile submission error:", err);
    setError("Failed to save profile. Please check your network and fields.");
    setSubmitting(false);
  }
  };

  const selectClasses = cn(
    "w-full rounded-[7px] border border-transparent bg-field px-[13px] py-[12px]",
    "font-mono-alt  leading-[normal] text-ink-card",
    "focus:outline-none focus:ring-2 focus:ring-brand/40"
  );

  return (
    <div>
      <FormStepper steps={STEPS} active={step} />

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
              <label className="mb-[10px] font-grotesk  font-semibold leading-[normal] text-label-ink">
                Year
              </label>
              <select
                value={form.year}
                onChange={set("year")}
                className={selectClasses}
              >
                <option value="">Select your year</option>
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-[10px] font-grotesk  font-semibold leading-[normal] text-label-ink">
                Degree
              </label>
              <select
                value={form.degree}
                onChange={set("degree")}
                className={selectClasses}
              >
                <option value="">Select your degree</option>
                {UTD_DEGREES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-[10px] font-grotesk  font-semibold leading-[normal] text-label-ink">
                Major
              </label>
              <select
                value={form.major}
                onChange={set("major")}
                className={selectClasses}
              >
                <option value="">Select your major</option>
                {UTD_MAJORS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
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
            <p className="style-body-text leading-[20.3px] text-ink-muted">
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
          <p className="mt-[12px]  text-red-600">{error}</p>
        )}

        {/* Navigation */}
        <div className="mt-[24px] flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" size="sm" type="button" onClick={back}>
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
              className={!canNext() ? "bg-gray-400 opacity-50 cursor-not-allowed" : ""}
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
