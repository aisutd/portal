"use client";

import { type ChangeEvent, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { FormStepper } from "@/components/apply/form-stepper";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { MobileApplyForm } from "@/components/mobile/apply/MobileApplyForm";
import {
  applicationFormStepFields,
  applicationSteps,
  personalFields,
} from "@/lib/data";

type ProfileResponse = {
  profile: {
    firstName: string;
    lastName: string;
    middleName: string;
    prefName: string;
    year: string;
    degree: string;
    major: string;
    utdEmail: string | null;
    utdNetId: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    resumeFile: {
      id: string;
      fileName: string;
    } | null;
  } | null;
};

type DraftResponse = {
  draft: {
    formPayloadJson: unknown;
    stepIndex: number;
    isSubmitted: boolean;
  } | null;
};

type ApplicationResponse = {
  application: {
    title: string;
  };
  submissionStatus: string | null;
};

type FieldValues = Record<string, string>;
type FieldErrors = Record<string, string>;

const stepFieldGroups: string[][] = applicationFormStepFields;
const allFieldLabels = stepFieldGroups.flat();
const RESUME_ACCEPT =
  ".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf";

const DEFAULT_FIELD_VALUES: FieldValues = allFieldLabels.reduce(
  (acc, field) => {
    acc[field] = "";
    return acc;
  },
  {} as FieldValues,
);

function toFieldValues(values: Partial<FieldValues>) {
  return allFieldLabels.reduce(
    (acc, field) => {
      acc[field] = values[field] ?? "";
      return acc;
    },
    { ...DEFAULT_FIELD_VALUES },
  );
}

function extractStringValues(payload: unknown): Partial<FieldValues> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const record = payload as Record<string, unknown>;
  const values: Partial<FieldValues> = {};

  for (const field of allFieldLabels) {
    const value = record[field];
    if (typeof value === "string") {
      values[field] = value;
    }
  }

  return values;
}

function profileToFieldValues(
  profile: ProfileResponse["profile"],
): Partial<FieldValues> {
  if (!profile) {
    return {};
  }

  return {
    "First Name": profile.firstName || "",
    "Last Name": profile.lastName || "",
    NetID: profile.utdNetId ?? "",
    "UTD Email *": profile.utdEmail ?? "",
    "LinkedIn *": profile.linkedinUrl ?? "",
    "Resume *": profile.resumeFile?.fileName ?? "",
  };
}

function isRequiredField(label: string) {
  return label.trim().endsWith("*");
}

function validateStep(values: FieldValues, fields: string[]) {
  const nextErrors: FieldErrors = {};

  for (const field of fields) {
    if (!isRequiredField(field)) {
      continue;
    }

    if (!values[field]?.trim()) {
      nextErrors[field] = "This field is required.";
    }
  }

  return nextErrors;
}

function validateAllRequiredFields(values: FieldValues) {
  const nextErrors: FieldErrors = {};

  for (const fields of stepFieldGroups) {
    for (const field of fields) {
      if (!isRequiredField(field) || values[field]?.trim()) {
        continue;
      }

      nextErrors[field] = "This field is required.";
    }
  }

  return nextErrors;
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-[24px]">
      <div className="h-[34px] w-[460px] max-w-full rounded-full bg-[#f4f1ea]" />
      <div className="h-[48px] w-full rounded-[11px] border border-border-soft bg-white" />
      <div className="h-[20px] w-[320px] rounded-full bg-[#f4f1ea]" />
      <div className="grid grid-cols-1 gap-x-[28px] gap-y-[20px] sm:grid-cols-2">
        {personalFields.map((label) => (
          <div key={label} className="flex flex-col gap-[7px]">
            <div className="h-[14px] w-[120px] rounded-full bg-[#f4f1ea]" />
            <div className="h-[42px] rounded-[8px] bg-[#f4f1ea]" />
          </div>
        ))}
      </div>
      <div className="flex w-full justify-between">
        <div className="h-[44px] w-[88px] rounded-[11px] bg-[#f4f1ea]" />
        <div className="h-[44px] w-[88px] rounded-[11px] bg-[#f4f1ea]" />
      </div>
    </div>
  );
}

function NotFoundState({ message }: { message: string }) {
  return (
    <div className="rounded-[18px] border border-border-soft bg-white p-[35px] style-body-text text-[14px] leading-[20.3px] text-ink-muted">
      {message}
    </div>
  );
}

function ApplyFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get("id");
  const [fieldValues, setFieldValues] =
    useState<FieldValues>(DEFAULT_FIELD_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [applicationTitle, setApplicationTitle] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const fieldValuesRef = useRef<FieldValues>(DEFAULT_FIELD_VALUES);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      if (!applicationId) {
        setError("No application selected.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [profileResponse, draftResponse, applicationResponse] =
          await Promise.all([
            fetch("/api/profile", { signal: controller.signal }),
            fetch(`/api/applications/${applicationId}/draft`, {
              signal: controller.signal,
            }),
            fetch(`/api/applications/${applicationId}`, {
              signal: controller.signal,
            }),
          ]);

        const profilePayload = profileResponse.ok
          ? ((await profileResponse.json()) as ProfileResponse)
          : { profile: null };
        const draftPayload = draftResponse.ok
          ? ((await draftResponse.json()) as DraftResponse)
          : { draft: null };
        const applicationPayload = applicationResponse.ok
          ? ((await applicationResponse.json()) as ApplicationResponse)
          : null;

        const mergedValues = {
          ...profileToFieldValues(profilePayload.profile),
          ...extractStringValues(draftPayload.draft?.formPayloadJson),
        };

        const nextValues = toFieldValues(mergedValues);
        setFieldValues(nextValues);
        fieldValuesRef.current = nextValues;
        setActiveStep(
          draftPayload.draft
            ? Math.min(
                Math.max(draftPayload.draft.stepIndex, 0),
                applicationSteps.length - 1,
              )
            : 0,
        );
        setAlreadySubmitted(Boolean(applicationPayload?.submissionStatus));
        setApplicationTitle(applicationPayload?.application.title ?? null);

        if (!applicationResponse.ok && applicationResponse.status === 404) {
          setError("Application not found.");
        }

        if (!draftResponse.ok && draftResponse.status === 404) {
          setError("Application draft not found.");
        }
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") {
          setError("Unable to load this application form right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      controller.abort();
    };
  }, [applicationId]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fieldValuesRef.current = fieldValues;
  }, [fieldValues]);

  if (!loading && !error && alreadySubmitted) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-cream">
        <Navbar active="Apply" />

        <div className="flex w-full flex-1 items-center justify-center px-[24px] py-[40px]">
          <div className="w-full max-w-[720px] rounded-[18px] border border-border-soft bg-white p-[32px] shadow-sm">
            <div className="flex flex-col gap-[14px]">
              <div className="inline-flex w-fit rounded-full bg-[#efece3] px-[14px] py-[6px] text-[12px] font-semibold leading-none text-ink-muted">
                Already submitted
              </div>
              <h1 className="style-page-title text-[32px] leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                {applicationTitle ?? "Application"}
              </h1>
              <p className="max-w-[560px] style-page-subtitle text-[15px] leading-[21.75px] text-ink-muted">
                You have already submitted an application for this program.
              </p>
              <button
                type="button"
                className="inline-flex h-[44px] w-fit items-center justify-center rounded-[11px] bg-brand px-[18px] text-[14px] font-bold leading-none text-white"
                onClick={() => router.push("/applications")}
              >
                Back to applications
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function persistDraft(nextValues: FieldValues, nextStepIndex: number) {
    if (!applicationId) {
      return;
    }

    const response = await fetch(`/api/applications/${applicationId}/draft`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        formPayloadJson: nextValues,
        stepIndex: nextStepIndex,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save draft: ${response.status}`);
    }
  }

  function scheduleDraftSave(nextValues: FieldValues, nextStepIndex: number) {
    if (!applicationId) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistDraft(nextValues, nextStepIndex).catch(() => {
        // Autosave failures are surfaced on submit; keep typing uninterrupted.
      });
    }, 500);
  }

  function handleNextStep() {
    const currentFields = stepFieldGroups[activeStep] ?? [];
    const nextErrors = validateStep(fieldValuesRef.current, currentFields);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitError(null);
    const nextStepIndex = Math.min(activeStep + 1, applicationSteps.length - 1);
    setFieldErrors({});

    if (nextStepIndex !== activeStep) {
      setActiveStep(nextStepIndex);
      scheduleDraftSave(fieldValuesRef.current, nextStepIndex);
    }
  }

  function handleBackStep() {
    const nextStepIndex = Math.max(activeStep - 1, 0);
    setFieldErrors({});
    setSubmitError(null);

    if (nextStepIndex !== activeStep) {
      setActiveStep(nextStepIndex);
      scheduleDraftSave(fieldValuesRef.current, nextStepIndex);
    }
  }

  async function handleSubmitApplication() {
    const nextErrors = validateAllRequiredFields(fieldValuesRef.current);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    if (!applicationId) {
      setSubmitError("No application selected.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    try {
      await persistDraft(fieldValuesRef.current, activeStep);

      const response = await fetch(
        `/api/applications/${applicationId}/submit`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        if (response.status === 409) {
          setSubmitError(
            "You have already submitted an application for this program.",
          );
          return;
        }

        throw new Error(`Failed to submit application: ${response.status}`);
      }

      const payload = (await response.json()) as {
        submission: {
          id: string;
        };
      };

      router.push(
        `/applications/submitted?submissionId=${payload.submission.id}`,
      );
    } catch {
      setSubmitError("Unable to submit your application right now.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(label: string) {
    const value = fieldValues[label] ?? "";
    const errorMessage = fieldErrors[label];
    const inputId = `f-${label.toLowerCase().replace(/\s+/g, "-")}`;

    if (label === "Resume *") {
      return (
        <div key={label} className="flex flex-col gap-[6px]">
          <label
            htmlFor={inputId}
            className="style-label-text text-[14px] leading-[20.3px] text-ink-muted"
          >
            {label}
          </label>
          <input
            ref={resumeInputRef}
            id={inputId}
            type="file"
            accept={RESUME_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) {
                const nextValues = {
                  ...fieldValuesRef.current,
                  [label]: "",
                };

                fieldValuesRef.current = nextValues;
                setFieldValues(nextValues);
                scheduleDraftSave(nextValues, activeStep);
                return;
              }

              const extension = file.name.split(".").pop()?.toLowerCase();
              if (!extension || !["pdf", "doc", "docx"].includes(extension)) {
                setFieldErrors((current) => ({
                  ...current,
                  [label]: "Please upload a .doc, .docx, or .pdf file.",
                }));
                event.currentTarget.value = "";
                return;
              }

              const nextValues = {
                ...fieldValuesRef.current,
                [label]: file.name,
              };
              fieldValuesRef.current = nextValues;
              setFieldValues(nextValues);
              setSubmitError(null);

              if (fieldErrors[label]) {
                setFieldErrors((current) => {
                  const nextErrors = { ...current };
                  delete nextErrors[label];
                  return nextErrors;
                });
              }

              scheduleDraftSave(nextValues, activeStep);
            }}
          />
          <div className="flex flex-col gap-[8px] sm:flex-row sm:items-center">
            <button
              type="button"
              className="flex h-[42px] items-center justify-center rounded-[8px] border border-border-soft bg-white px-[14px] font-body text-[13px] font-semibold leading-none text-ink shadow-sm transition-colors hover:bg-[#fbfaf7]"
              onClick={() => resumeInputRef.current?.click()}
            >
              Upload file
            </button>
            <span className="font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-ink-muted">
              {value || "No file selected"}
            </span>
          </div>
          <p className="font-body text-[12px] leading-[17px] text-ink-muted">
            Accepted formats: .doc, .docx, .pdf
          </p>
          {errorMessage ? (
            <p className="font-body text-[12px] leading-[17px] text-[#9a3b36]">
              {errorMessage}
            </p>
          ) : null}
        </div>
      );
    }

    const commonProps = {
      label,
      value,
      "aria-invalid": Boolean(errorMessage),
      className: errorMessage ? "ring-1 ring-[#9a3b36]/35" : undefined,
      onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        const nextValues = {
          ...fieldValuesRef.current,
          [label]: event.target.value,
        };
        fieldValuesRef.current = nextValues;
        setFieldValues(nextValues);

        if (fieldErrors[label]) {
          setFieldErrors((current) => {
            const nextErrors = { ...current };
            delete nextErrors[label];
            return nextErrors;
          });
        }
      },
      onBlur: () => {
        scheduleDraftSave(fieldValuesRef.current, activeStep);
      },
    };

    return (
      <div key={label} className="flex flex-col gap-[6px]">
        {activeStep === 0 ? (
          <FormField {...commonProps} />
        ) : (
          <FormTextarea {...commonProps} />
        )}
        {errorMessage ? (
          <p className="font-body text-[12px] leading-[17px] text-[#9a3b36]">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <MobileApplyForm />
      </div>

      <div className="hidden md:block">
    <div className="flex min-h-screen w-full flex-col bg-cream">
      <Navbar active="Apply" />

      <div className="flex w-full flex-col items-center px-[47px] pt-[34px] pb-[120px]">
        {/* Application card */}
        <div className="w-full max-w-[1346px] rounded-[18px] border border-border-soft bg-white p-[35px] [filter:drop-shadow(0px_8px_11px_rgba(0,0,0,0.04))]">
          <div className="flex flex-col gap-[24px]">
            <h1 className="style-page-title text-[32px] leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
              {applicationTitle ?? "Application"}
            </h1>

            <FormStepper steps={applicationSteps} active={activeStep} />

            <p className="style-body-text text-[14px] leading-[20.3px] text-ink">
              * Please verify that the following information is correct
            </p>

            {loading ? (
              <LoadingState />
            ) : error ? (
              <NotFoundState message={error} />
            ) : (
              <>
                {/* Field grid */}
                <div className="grid grid-cols-1 gap-x-[28px] gap-y-[20px] sm:grid-cols-2">
                  {(stepFieldGroups[activeStep] ?? []).map((label) =>
                    renderField(label),
                  )}
                </div>

                {submitError ? (
                  <p className="font-body text-[13px] leading-[18px] text-[#9a3b36]">
                    {submitError}
                  </p>
                ) : null}

                {/* Navigation */}
                <div className="flex w-full justify-between">
                  <button
                    type="button"
                    className="flex h-[44px] items-center justify-center rounded-[11px] border border-border-soft bg-white px-[18px] font-body text-[14px] font-semibold leading-none text-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleBackStep}
                    disabled={activeStep === 0}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    aria-label={
                      activeStep >= applicationSteps.length - 1
                        ? "Submit application"
                        : "Next step"
                    }
                    className="flex h-[44px] min-w-[96px] items-center justify-center rounded-[11px] bg-brand px-[18px] text-[14px] font-bold leading-none text-white disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={
                      activeStep >= applicationSteps.length - 1
                        ? handleSubmitApplication
                        : handleNextStep
                    }
                    disabled={submitting}
                    onBlur={() => {
                      scheduleDraftSave(fieldValuesRef.current, activeStep);
                    }}
                  >
                    {submitting
                      ? "Submitting..."
                      : activeStep >= applicationSteps.length - 1
                        ? "Done"
                        : "Next"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
      </div>
    </>
  );
}

function ApplyFormFallback() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-cream">
      <Navbar active="Apply" />
      <div className="flex w-full flex-col items-center px-[47px] pt-[34px] pb-[120px]">
        <div className="w-full max-w-[1346px] rounded-[18px] border border-border-soft bg-white p-[35px] [filter:drop-shadow(0px_8px_11px_rgba(0,0,0,0.04))]">
          <LoadingState />
        </div>
      </div>
    </div>
  );
}

export default function ApplyFormPage() {
  return (
    <Suspense fallback={<ApplyFormFallback />}>
      <ApplyFormContent />
    </Suspense>
  );
}
