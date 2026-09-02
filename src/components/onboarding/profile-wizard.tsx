"use client";
//TODO - Make what is required at profile creation consistent across api and this doc's canNext()
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormStepper } from "@/components/apply/form-stepper";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UTD_DEGREES, UTD_MAJORS, ACADEMIC_YEARS } from "@/lib/utd-data";

// 1. Updated STEPS to remove "Links"
const STEPS = ["Personal", "Academic"];

function SelectArrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
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

// 2. Helper function to format input: lowercases all, then capitalizes first letter of each word
const capitalizeName = (str: string) => {
  return str
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (match) => match.toUpperCase());
};

type ProfileWizardProps = {
  email: string;
};

export function ProfileWizard({ email }: ProfileWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUtdEmail =
    email.endsWith("@utdallas.edu") ||
    email.endsWith("@aisociety.io") ||
    email.endsWith("@aisutd.org");
  const derivedNetId = isUtdEmail ? email.split("@")[0] : "";
  const initialNetId = /^[a-z]{3}\d{5,6}$/i.test(derivedNetId)
    ? derivedNetId
    : "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    prefName: "",
    year: "",
    degree: "",
    major: "",
    utdEmail: isUtdEmail ? email : "",
    utdNetId: initialNetId,
  });

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = e.target.value;

      // Apply formatting to name fields
      if (
        field === "firstName" ||
        field === "lastName" ||
        field === "middleName" ||
        field === "prefName"
      ) {
        value = capitalizeName(value);
      }

      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const canNext = () => {
    if (step === 0)
      return (
        form.firstName.trim() && form.lastName.trim() // && form.prefName.trim()
      );
    if (step === 1) return Boolean(form.utdNetId);
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
    "w-full appearance-none rounded-[7px] border border-transparent bg-field py-[12px] pl-[13px] pr-[36px]",
    "font-mono-alt text-[13px] leading-[normal] text-ink-card",
    "focus:outline-none focus:ring-2 focus:ring-brand/40"
  );

  return (
    <div>
      <FormStepper steps={STEPS} active={step} onDark />

      <div className="mt-5 rounded-2xl border border-border-soft bg-white p-7.5">
        {/* Step 1 — Personal */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label className="mb-2.5 font-grotesk text-[13px] font-semibold leading-[normal] text-label-ink">
                Year
              </label>
              <div className="relative">
                <select
                  value={form.year}
                  onChange={set("year")}
                  className={selectClasses}
                >
                  <option value="">Select year</option>
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-2.5 font-grotesk text-[13px] font-semibold leading-[normal] text-label-ink">
                Degree
              </label>
              <div className="relative">
                <select
                  value={form.degree}
                  onChange={set("degree")}
                  className={selectClasses}
                >
                  <option value="">Select degree</option>
                  {UTD_DEGREES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-2.5 font-grotesk text-[13px] font-semibold leading-[normal] text-label-ink">
                Major
              </label>
              <div className="relative">
                <select
                  value={form.major}
                  onChange={set("major")}
                  className={selectClasses}
                >
                  <option value="">Select major</option>
                  {UTD_MAJORS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
            </div>
            <Field
              label="AIS or UTD Email"
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

        {error && (
          <p className="mt-3 text-[12px] text-red-600">{error}</p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
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
              className={!canNext() ? "bg-gray-400 opacity-50 cursor-not-allowed" : ""}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="auth"
              type="button"
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
            >
              {submitting ? "Saving..." : "Complete Profile"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}