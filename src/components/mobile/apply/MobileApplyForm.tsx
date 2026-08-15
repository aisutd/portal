"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FormStepper } from "@/components/apply/form-stepper";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
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

type FieldValues = Record<string, string>;
type FieldErrors = Record<string, string>;

const stepFieldGroups: string[][] = applicationFormStepFields;
const allFieldLabels = stepFieldGroups.flat();

const DEFAULT_FIELD_VALUES: FieldValues = allFieldLabels.reduce(
  (acc, field) => {
    acc[field] = "";
    return acc;
  },
  {} as FieldValues
);

function toFieldValues(values: Partial<FieldValues>) {
  return allFieldLabels.reduce((acc, field) => {
    acc[field] = values[field] ?? "";
    return acc;
  }, { ...DEFAULT_FIELD_VALUES });
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
    <div className="rounded-[16px] border border-border-soft bg-white p-[20px] font-mobile-body text-[13px] text-ink-muted">
      {message}
    </div>
  );
}

export function MobileApplyForm() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");
  const [fieldValues, setFieldValues] = useState<FieldValues>(DEFAULT_FIELD_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
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
        const [profileResponse, draftResponse] = await Promise.all([
          fetch("/api/profile", { signal: controller.signal }),
          fetch(`/api/applications/${applicationId}/draft`, {
            signal: controller.signal,
          }),
        ]);

        const profilePayload = profileResponse.ok
          ? ((await profileResponse.json()) as ProfileResponse)
          : { profile: null };
        const draftPayload = draftResponse.ok
          ? ((await draftResponse.json()) as DraftResponse)
          : { draft: null };

        const mergedValues = {
          ...profileToFieldValues(profilePayload.profile),
          ...extractStringValues(draftPayload.draft?.formPayloadJson),
        };

        const nextValues = toFieldValues(mergedValues);
        setFieldValues(nextValues);
        fieldValuesRef.current = nextValues;
        setActiveStep(
          draftPayload.draft
            ? Math.min(Math.max(draftPayload.draft.stepIndex, 0), applicationSteps.length - 1)
            : 0
        );

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

  function scheduleDraftSave(nextValues: FieldValues, nextStepIndex: number) {
    if (!applicationId) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void fetch(`/api/applications/${applicationId}/draft`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formPayloadJson: nextValues,
          stepIndex: nextStepIndex,
        }),
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

    if (nextStepIndex !== activeStep) {
      setActiveStep(nextStepIndex);
      scheduleDraftSave(fieldValuesRef.current, nextStepIndex);
    }
  }

  function renderField(label: string) {
    const value = fieldValues[label] ?? "";
    const errorMessage = fieldErrors[label];
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
          <p className="font-mobile-body text-[11px] text-[#9a3b36]">{errorMessage}</p>
        ) : null}
      </div>
    );
  }

  return (
    <MobileScreen>
      <div className="flex flex-col gap-[18px] rounded-[16px] border border-border-soft bg-white p-[20px] [filter:drop-shadow(0px_8px_11px_rgba(0,0,0,0.04))]">
        <h1 className="font-mobile-display text-[17px] font-bold text-ink">
          AIM Mentor Application · Fall 2026
        </h1>

        <FormStepper steps={applicationSteps} active={activeStep} />

        <p className="font-mobile-body text-[12px] font-bold text-ink">
          * Please verify that the following information is correct
        </p>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <NotFoundState message={error} />
        ) : (
          <>
            <div className="flex flex-col gap-[14px]">
              {(stepFieldGroups[activeStep] ?? []).map((label) => renderField(label))}
            </div>

            <div className="flex w-full justify-between">
              <button
                type="button"
                className="flex h-[42px] items-center justify-center rounded-[11px] border border-border-soft bg-white px-[16px] font-mobile-body text-[13px] font-bold text-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleBackStep}
                disabled={activeStep === 0}
              >
                Back
              </button>
              <button
                type="button"
                aria-label="Next step"
                className="flex h-[42px] min-w-[88px] items-center justify-center rounded-[11px] bg-brand px-[16px] text-[13px] font-bold leading-none text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleNextStep}
                disabled={activeStep >= applicationSteps.length - 1}
                onBlur={() => {
                  scheduleDraftSave(fieldValuesRef.current, activeStep);
                }}
              >
                {activeStep >= applicationSteps.length - 1 ? "Done" : "Next"}
              </button>
            </div>
          </>
        )}
      </div>
    </MobileScreen>
  );
}
