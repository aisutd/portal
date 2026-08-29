"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormStepper } from "@/components/apply/form-stepper";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { MobileReadOnlyField } from "@/components/mobile/apply/MobileReadOnlyField";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { personalFields } from "@/lib/data";
import {
  EMPTY_LAYOUT,
  buildFormLayout,
  extractStringValues,
  findFirstStepWithError,
  toFieldValues,
  validateFields,
  type ApplicationFormLayout,
  type FieldValues,
} from "@/lib/application-form";

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
    id: string;
    title: string;
    description: string;
    phase: string;
    questions: string[];
  };
  submissionStatus: string | null;
};

type FieldErrors = Record<string, string>;

function profileToFieldValues(profile: ProfileResponse["profile"]): Partial<FieldValues> {
  if (!profile) {
    return {};
  }

  return {
    "First Name": profile.firstName || "",
    "Last Name": profile.lastName || "",
    "NetID": profile.utdNetId ?? "",
    "UTD Email *": profile.utdEmail ?? "",
    "LinkedIn *": profile.linkedinUrl ?? "",
    "Resume *": profile.resumeFile?.fileName ?? "",
  };
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="h-[26px] w-[80%] rounded-full bg-[#f4f1ea]" />
      <div className="h-[40px] w-full rounded-[11px] border border-border-soft bg-white" />
      <div className="flex flex-col gap-[14px]">
        {personalFields.map((label) => (
          <div key={label} className="flex flex-col gap-[7px]">
            <div className="h-[12px] w-[100px] rounded-full bg-[#f4f1ea]" />
            <div className="h-[40px] rounded-[8px] bg-[#f4f1ea]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotFoundState({ message }: { message: string }) {
  return (
    <div className="rounded-[16px] border border-border-soft bg-white p-[20px] style-mobile-body text-ink-muted">
      {message}
    </div>
  );
}

export function MobileApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");
  const [layout, setLayout] = useState<ApplicationFormLayout>(EMPTY_LAYOUT);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [applicationTitle, setApplicationTitle] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const fieldValuesRef = useRef<FieldValues>({});
  const isReviewStep = activeStep === layout.reviewStepIndex;

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
        const [profileResponse, draftResponse, applicationResponse] = await Promise.all([
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

        const nextLayout = buildFormLayout(applicationPayload?.application.questions);
        setLayout(nextLayout);

        const mergedValues = {
          ...profileToFieldValues(profilePayload.profile),
          ...extractStringValues(
            nextLayout.allFieldLabels,
            draftPayload.draft?.formPayloadJson
          ),
        };

        const nextValues = toFieldValues(nextLayout.allFieldLabels, mergedValues);
        setFieldValues(nextValues);
        fieldValuesRef.current = nextValues;
        // A draft saved against a longer question set can point past the end.
        setActiveStep(
          draftPayload.draft
            ? Math.min(Math.max(draftPayload.draft.stepIndex, 0), nextLayout.steps.length - 1)
            : 0
        );

        setAlreadySubmitted(Boolean(applicationPayload?.submissionStatus));
        setApplicationTitle(applicationPayload?.application.title ?? null);

        if (!applicationResponse.ok && applicationResponse.status === 404) {
          setError("Application not found.");
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

  async function persistDraft(nextValues: FieldValues, nextStepIndex: number) {
    if (!applicationId) return;

    const response = await fetch(`/api/applications/${applicationId}/draft`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
    if (!applicationId) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistDraft(nextValues, nextStepIndex).catch(() => {});
    }, 500);
  }

  function handleNextStep() {
    const currentFields = layout.stepFieldGroups[activeStep] ?? [];
    const nextErrors = validateFields(fieldValuesRef.current, currentFields);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitError(null);
    const nextStepIndex = Math.min(activeStep + 1, layout.steps.length - 1);
    setFieldErrors({});

    if (nextStepIndex !== activeStep) {
      setActiveStep(nextStepIndex);
      scheduleDraftSave(fieldValuesRef.current, nextStepIndex);
    }
  }

  function handleEditStep(nextStepIndex: number) {
    setFieldErrors({});
    setSubmitError(null);

    if (nextStepIndex !== activeStep) {
      setActiveStep(nextStepIndex);
      scheduleDraftSave(fieldValuesRef.current, nextStepIndex);
    }
  }

  function handleBackStep() {
    handleEditStep(Math.max(activeStep - 1, 0));
  }

  async function handleSubmitApplication() {
    const nextErrors = validateFields(
      fieldValuesRef.current,
      layout.allFieldLabels
    );

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);

      const errorStep = findFirstStepWithError(
        layout.stepFieldGroups,
        nextErrors
      );

      if (errorStep >= 0 && errorStep !== activeStep) {
        setActiveStep(errorStep);
        scheduleDraftSave(fieldValuesRef.current, errorStep);
      }

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

      const response = await fetch(`/api/applications/${applicationId}/submit`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 409) {
          setSubmitError("You have already submitted an application for this program.");
          return;
        }

        // The server re-checks the answers; surface what it objected to.
        if (response.status === 400) {
          const payload = (await response.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;

          setSubmitError(
            payload?.error?.message ??
              "Some answers are missing or incorrectly formatted."
          );
          return;
        }

        throw new Error(`Failed to submit application: ${response.status}`);
      }

      const payload = (await response.json()) as { submission: { id: string } };
      router.push(`/applications/submitted?submissionId=${payload.submission.id}`);
    } catch (caught) {
      setSubmitError((caught as Error).message || "An error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  function renderField(label: string) {
    const value = fieldValues[label] ?? "";
    const errorMessage = fieldErrors[label];

    if (label.startsWith("Resume")) {
      return (
        <div key={label} className="flex flex-col gap-[6px]">
          <label className="font-sans  font-bold text-ink">
            {label}
          </label>
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;

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
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              className="flex h-[38px] items-center justify-center rounded-[8px] border border-border-soft bg-white px-[14px] font-sans  font-bold text-ink shadow-xs transition-colors hover:bg-[#fbfaf7]"
              onClick={() => resumeInputRef.current?.click()}
            >
              Upload file
            </button>
            <span className="style-caption text-ink-muted truncate max-w-[200px]">
              {value || "No file selected"}
            </span>
          </div>
          <p className="font-sans  text-ink-faint">
            Accepted formats: .pdf, .doc, .docx
          </p>
          {errorMessage ? (
            <p className="font-sans  ">{errorMessage}</p>
          ) : null}
        </div>
      );
    }

    const commonProps = {
      label,
      value,
      "aria-invalid": Boolean(errorMessage),
      className: errorMessage ? "ring-1 ring-[#9a3b36]/35" : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          <p className="style-mobile-body ">{errorMessage}</p>
        ) : null}
      </div>
    );
  }

  return (
    <MobileScreen>
      <div className="flex flex-col gap-[18px] rounded-[16px] border border-border-soft bg-white p-[20px] [filter:drop-shadow(0px_8px_11px_rgba(0,0,0,0.04))]">
        <h1 className="style-mobile-title text-ink">
          {applicationTitle || "Application Form"}
        </h1>

        <FormStepper steps={layout.steps} active={activeStep} />

        <p className="style-mobile-body font-bold text-ink">
          {isReviewStep
            ? "Check every answer below before you submit. An application cannot be edited once it is submitted."
            : "* Please verify that the following information is correct"}
        </p>

        {alreadySubmitted && (
          <div className="rounded-[12px] bg-[#fbfaf7] border border-border-soft p-[12px] font-sans  text-ink-muted">
            You have already submitted an application for this program.
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : error ? (
          <NotFoundState message={error} />
        ) : (
          <>
            {isReviewStep ? (
              /* Every answer, read-only, one section per editable step. */
              <div className="flex flex-col gap-[20px]">
                {layout.steps
                  .slice(0, layout.reviewStepIndex)
                  .map((step, stepIndex) => (
                    <div key={step} className="flex flex-col gap-[14px]">
                      <div className="flex items-center justify-between">
                        <p className="style-mobile-body font-bold text-ink">{step}</p>
                        <button
                          type="button"
                          aria-label={`Edit ${step}`}
                          className="style-caption text-brand underline underline-offset-[3px]"
                          onClick={() => handleEditStep(stepIndex)}
                        >
                          Edit
                        </button>
                      </div>
                      {(layout.stepFieldGroups[stepIndex] ?? []).map((label) => (
                        <MobileReadOnlyField
                          key={label}
                          label={label}
                          value={fieldValues[label] ?? ""}
                          multiline={stepIndex > 0}
                        />
                      ))}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col gap-[14px]">
                {(layout.stepFieldGroups[activeStep] ?? []).map((label) => renderField(label))}
              </div>
            )}

            {submitError && (
              <p className="font-sans  ">{submitError}</p>
            )}

            <div className="flex w-full justify-between">
              <button
                type="button"
                className="flex h-[42px] items-center justify-center rounded-[11px] border border-border-soft bg-white px-[16px] style-mobile-body font-bold text-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleBackStep}
                disabled={activeStep === 0 || submitting}
              >
                Back
              </button>
              <button
                type="button"
                aria-label={activeStep >= layout.steps.length - 1 ? "Submit application" : "Next step"}
                className="flex h-[42px] min-w-[88px] items-center justify-center rounded-[11px] bg-brand px-[16px]  font-bold leading-none text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={activeStep >= layout.steps.length - 1 ? handleSubmitApplication : handleNextStep}
                disabled={submitting}
                onBlur={() => {
                  scheduleDraftSave(fieldValuesRef.current, activeStep);
                }}
              >
                {submitting
                  ? "Submitting..."
                  : activeStep >= layout.steps.length - 1
                    ? "Done"
                    : "Next"}
              </button>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </MobileScreen>
  );
}
