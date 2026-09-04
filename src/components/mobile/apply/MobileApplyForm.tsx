"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgramType } from "@prisma/client";
import { FormStepper } from "@/components/apply/form-stepper";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { MobileReadOnlyField } from "@/components/mobile/apply/MobileReadOnlyField";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { personalFields } from "@/lib/data";
import { uploadResumeAction } from "@/app/profile/resume";
import { FormattedLinks } from "@/components/ui/formatted-link";
import { UTD_MAJORS, UTD_DEGREES, ACADEMIC_YEARS } from "@/lib/utd-data";
import { getProgramTypeDesign } from "@/lib/program-types"; // Update import path if needed
import {
  EMPTY_LAYOUT,
  buildFormLayout,
  extractStringValues,
  findFirstStepWithError,
  toFieldValues,
  validateFields,
  normalizeFieldLabel,
  isRequiredField,
  type ApplicationFormLayout,
  type FieldValues,
} from "@/lib/application-form";

export type QuestionType =
  | "TEXT"
  | "LONG_TEXT"
  | "DROPDOWN"
  | "CHECKBOX"
  | "FILE"
  | "text"
  | "long_text"
  | "textarea"
  | "select"
  | "dropdown"
  | "checkbox"
  | "file"
  | "radio"
  | "multiselect";

export type QuestionConfig = {
  id?: string;
  label: string;
  type?: QuestionType | string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
};

type ProfileResponse = {
  profile: {
    firstName: string;
    lastName: string;
    middleName?: string;
    prefName?: string;
    year?: string | null;
    degree?: string | null;
    major?: string | null;
    phoneNumber?: string | null;
    personalEmail?: string | null;
    utdEmail: string | null;
    utdNetId: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    resumeFile: {
      id: string;
      fileName: string;
      url?: string;
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

type RequiredProfileFields = {
  requirePhoneNumber?: boolean;
  requirePersonalEmail?: boolean;
  requireResume?: boolean;
  requireLinkedin?: boolean;
  requireGithub?: boolean;
  requirePortfolio?: boolean;
};

type ApplicationResponse = {
  application: {
    id: string;
    title: string;
    link: string[];
    programType?: ProgramType | string;
    description?: string;
    phase?: string;
    questions: (string | QuestionConfig)[];
    requiredProfileFields?: RequiredProfileFields;
  };
  submissionStatus: string | null;
};

type FieldErrors = Record<string, string>;

const RESUME_ACCEPT =
  ".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf";
const GENERIC_FILE_ACCEPT =
  ".jpg,.jpeg,.png,.pdf,.docx,.txt,image/jpeg,image/png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf", "docx", "txt"];

function profileToFieldValues(
  profile: ProfileResponse["profile"]
): Partial<FieldValues> {
  if (!profile) return {};

  const getLabel = (base: string) =>
    personalFields.find((f) => f.replace(/\s*\*$/, "") === base) || base;

  return {
    [getLabel("First Name")]: profile.firstName || "",
    [getLabel("Last Name")]: profile.lastName || "",
    [getLabel("Preferred Name")]: profile.prefName || "",
    [getLabel("NetID")]: profile.utdNetId ?? "",
    [getLabel("Year")]: profile.year ?? "",
    [getLabel("Major")]: profile.major ?? "",
    [getLabel("Degree")]: profile.degree ?? "",
    [getLabel("Phone Number")]: profile.phoneNumber ?? "",
    [getLabel("Personal Email")]: profile.personalEmail ?? "",
    [getLabel("UTD Email")]: profile.utdEmail ?? "",
    [getLabel("LinkedIn")]: profile.linkedinUrl ?? "",
    [getLabel("GitHub")]: profile.githubUrl ?? "",
    [getLabel("Portfolio")]: profile.portfolioUrl ?? "",
    [getLabel("Resume")]: profile.resumeFile?.fileName ?? "",
  };
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium transition-all duration-200">
      {status === "saving" && (
        <>
          <span className="h-2 w-2 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <span className="text-ink-muted">Saving...</span>
        </>
      )}

      {status === "saved" && (
        <>
          <svg
            className="h-3.5 w-3.5 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-700">Saved</span>
        </>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-[18px] animate-pulse">
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
  const [questionsMap, setQuestionsMap] = useState<Record<string, QuestionConfig>>({});
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [applicationTitle, setApplicationTitle] = useState<string | null>(null);
  const [applicationLink, setApplicationLink] = useState<string[]>([]);
  const [programType, setProgramType] = useState<ProgramType | string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const saveTimerRef = useRef<number | null>(null);
  const fieldValuesRef = useRef<FieldValues>({});
  const isReviewStep = activeStep === layout.reviewStepIndex;

  const design = getProgramTypeDesign(programType);

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

        const rawQuestions = applicationPayload?.application?.questions ?? [];
        const rawRequirements = applicationPayload?.application?.requiredProfileFields as
          | Record<string, boolean>
          | undefined;

        const qMap: Record<string, QuestionConfig> = {};
        const normalizedLabels: string[] = [];

        if (rawRequirements) {
          const profileMap: Record<string, boolean | undefined> = {
            "Phone Number": rawRequirements.requirePhoneNumber,
            "Personal Email": rawRequirements.requirePersonalEmail,
            Resume: rawRequirements.requireResume,
            LinkedIn: rawRequirements.requireLinkedin,
            GitHub: rawRequirements.requireGithub,
            Portfolio: rawRequirements.requirePortfolio,
          };

          Object.entries(profileMap).forEach(([fieldLabel, isRequired]) => {
            const config = { label: fieldLabel, required: Boolean(isRequired) };
            qMap[fieldLabel] = config;
            qMap[`${fieldLabel} *`] = config;
          });
        }

        rawQuestions.forEach((q, idx) => {
          if (typeof q === "string") {
            const cleanLabel = q.trim() || `Question ${idx + 1}`;
            qMap[cleanLabel] = { label: cleanLabel, type: "TEXT" };
            normalizedLabels.push(cleanLabel);
          } else if (q && typeof q === "object") {
            const cleanLabel = q.label?.trim() || `Question ${idx + 1}`;
            const rawType = String(q.type || "").toUpperCase().trim();
            let normalizedType: QuestionType = "TEXT";

            if (rawType === "DROPDOWN" || rawType === "SELECT") {
              normalizedType = "DROPDOWN";
            } else if (rawType === "FILE") {
              normalizedType = "FILE";
            } else if (rawType === "CHECKBOX" || rawType === "MULTISELECT") {
              normalizedType = "CHECKBOX";
            } else if (
              rawType === "LONG_TEXT" ||
              rawType === "LONGTEXT" ||
              rawType === "TEXTAREA" ||
              rawType === "PARAGRAPH"
            ) {
              normalizedType = "LONG_TEXT";
            } else {
              normalizedType = "TEXT";
            }

            qMap[cleanLabel] = {
              ...q,
              label: cleanLabel,
              type: normalizedType,
            };
            normalizedLabels.push(cleanLabel);
          }
        });

        if (!controller.signal.aborted) {
          setQuestionsMap(qMap);

          const nextLayout = buildFormLayout(normalizedLabels);
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

          setActiveStep(
            draftPayload.draft
              ? Math.min(
                  Math.max(draftPayload.draft.stepIndex, 0),
                  nextLayout.steps.length - 1
                )
              : 0
          );

          setAlreadySubmitted(Boolean(applicationPayload?.submissionStatus));
          setApplicationTitle(applicationPayload?.application?.title ?? null);
          setProgramType(applicationPayload?.application?.programType ?? null);
          setApplicationLink(applicationPayload?.application.link ?? []);

          if (!applicationResponse.ok && applicationResponse.status === 404) {
            setError("Application not found.");
          }
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

  async function patchProfileValues(label: string, value: string) {
    const cleanLabel = label.replace(/\s*\*$/, "");
    const fieldMapping: Record<string, string> = {
      "First Name": "firstName",
      "Last Name": "lastName",
      "Preferred Name": "prefName",
      Year: "year",
      Major: "major",
      Degree: "degree",
      NetID: "utdNetId",
      "Phone Number": "phoneNumber",
      "Personal Email": "personalEmail",
      "UTD Email": "utdEmail",
      LinkedIn: "linkedinUrl",
      GitHub: "githubUrl",
      Portfolio: "portfolioUrl",
    };

    const targetKey = fieldMapping[cleanLabel];
    if (!targetKey) return;

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [targetKey]: value }),
      });
    } catch {
      // Background patch failure silently swallowed
    }
  }

  async function persistDraft(nextValues: FieldValues, nextStepIndex: number) {
    if (!applicationId) return;

    setSaveStatus("saving");

    try {
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

      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("idle");
      throw err;
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

  function handleValueChange(label: string, value: string) {
    setSaveStatus("saving");
    const nextValues = {
      ...fieldValuesRef.current,
      [label]: value,
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

    if (personalFields.includes(label) || personalFields.includes(label.replace(/\s*\*$/, ""))) {
      patchProfileValues(label, value);
    }
  }

  async function handleServerActionResumeUpload(file: File) {
    setUploadingResume(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadResumeAction(formData);

      if (!res.success) {
        throw new Error(res.error || "Upload failed");
      }

      handleValueChange("Resume", file.name);
      scheduleDraftSave(fieldValuesRef.current, activeStep);
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        "Resume *": (err as Error).message || "Upload failed. Please try again.",
      }));
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleApplicationFileUpload(label: string, file: File) {
    if (!applicationId) return;

    setUploadingFields((prev) => ({ ...prev, [label]: true }));
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/applications/${applicationId}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Upload failed");
      }

      const filePayload = JSON.stringify({
        fileName: file.name,
        url: data.url || data.key,
      });

      handleValueChange(label, filePayload);
      scheduleDraftSave(fieldValuesRef.current, activeStep);
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        [label]: (err as Error).message || "Upload failed. Please try again.",
      }));
    } finally {
      setUploadingFields((prev) => ({ ...prev, [label]: false }));
    }
  }

  function handleNextStep() {
    const currentFields = layout.stepFieldGroups[activeStep] ?? [];
    const nextErrors = validateFields(
      fieldValuesRef.current,
      currentFields,
      questionsMap
    );

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
      layout.allFieldLabels,
      questionsMap
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
          setSubmitError(
            "You have already submitted an application for this program."
          );
          return;
        }

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
      setSubmitError(
        (caught as Error).message || "An error occurred while submitting."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(label: string) {
    const value = fieldValues[label] ?? "";
    const cleanLabel = normalizeFieldLabel(label);
    const errorMessage = fieldErrors[cleanLabel] || fieldErrors[label];
    const inputId = `mobile-f-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const config = questionsMap[cleanLabel] || questionsMap[label];
    const required = isRequiredField(label, questionsMap);
    const displayLabel = required && !label.includes("*") ? `${label} *` : label;

    const rawType = String(config?.type || "").toUpperCase().trim();

    let resolvedType: QuestionType = "TEXT";
    let options = config?.options;

    if (cleanLabel === "Major") {
      resolvedType = "DROPDOWN";
      options = UTD_MAJORS;
    } else if (cleanLabel === "Degree") {
      resolvedType = "DROPDOWN";
      options = UTD_DEGREES;
    } else if (cleanLabel === "Year" || cleanLabel === "Academic Year") {
      resolvedType = "DROPDOWN";
      options = ACADEMIC_YEARS;
    } else if (cleanLabel === "Resume") {
      resolvedType = "FILE";
    } else if (
      rawType === "LONG_TEXT" ||
      rawType === "LONGTEXT" ||
      rawType === "TEXTAREA" ||
      rawType === "PARAGRAPH"
    ) {
      resolvedType = "LONG_TEXT";
    } else if (rawType === "DROPDOWN" || rawType === "SELECT") {
      resolvedType = "DROPDOWN";
    } else if (rawType === "CHECKBOX" || rawType === "MULTISELECT") {
      resolvedType = "CHECKBOX";
    } else if (rawType === "FILE") {
      resolvedType = "FILE";
    } else {
      resolvedType = "TEXT";
    }

    if (resolvedType === "FILE") {
      const isProfileResume = cleanLabel === "Resume";
      const acceptTypes = isProfileResume ? RESUME_ACCEPT : GENERIC_FILE_ACCEPT;
      const isUploading = isProfileResume
        ? uploadingResume
        : Boolean(uploadingFields[label]);

      let displayFileName = "";
      let fileUrl = "";

      if (value) {
        try {
          const parsed = JSON.parse(value);
          displayFileName = parsed.fileName || parsed.name || "";
          fileUrl = parsed.url || "";
        } catch {
          if (value.startsWith("http://") || value.startsWith("https://")) {
            fileUrl = value;
            const rawName = value.split("/").pop() || "Uploaded File";
            displayFileName = rawName.replace(/^\d+_\s*/, "");
          } else {
            displayFileName = value.replace(/^\d+_\s*/, "");
          }
        }
      }

      return (
        <div key={label} className="flex flex-col gap-[6px]">
          <label htmlFor={inputId} className="font-sans font-bold text-ink">{displayLabel}</label>
          {config?.description ? (
            <p className="font-sans text-ink-faint text-xs -mt-1">{config.description}</p>
          ) : null}
          <input
            id={inputId}
            type="file"
            accept={acceptTypes}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              const extension = file.name.split(".").pop()?.toLowerCase();
              const validTypes = isProfileResume
                ? ["pdf", "doc", "docx"]
                : ALLOWED_EXTENSIONS;

              if (!extension || !validTypes.includes(extension)) {
                setFieldErrors((current) => ({
                  ...current,
                  [label]: isProfileResume
                    ? "Please upload a .doc, .docx, or .pdf file."
                    : "Please upload a valid file (.jpg, .png, .pdf, .docx, .txt).",
                }));
                event.currentTarget.value = "";
                return;
              }

              if (isProfileResume) {
                void handleServerActionResumeUpload(file);
              } else {
                void handleApplicationFileUpload(label, file);
              }
            }}
          />
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              disabled={isUploading}
              className="flex h-[38px] items-center justify-center rounded-[8px] border border-border-soft bg-white px-[14px] font-sans font-bold text-ink shadow-xs transition-colors hover:bg-[#fbfaf7] disabled:opacity-50"
              onClick={(e) => {
                const container = e.currentTarget.parentElement?.parentElement;
                const fileInput = container?.querySelector<HTMLInputElement>(
                  'input[type="file"]'
                );
                fileInput?.click();
              }}
            >
              {isUploading ? "Uploading..." : "Upload file"}
            </button>
            {displayFileName ? (
              fileUrl ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="style-caption text-brand underline truncate max-w-[200px]"
                >
                  {displayFileName}
                </a>
              ) : (
                <span className="style-caption text-ink truncate max-w-[200px]">
                  {displayFileName}
                </span>
              )
            ) : (
              <span className="style-caption text-ink-muted truncate max-w-[200px]">
                No file selected
              </span>
            )}
          </div>
          <p className="font-sans text-ink-faint">
            {isProfileResume
              ? "Accepted formats: .pdf, .doc, .docx"
              : "Accepted formats: .jpg, .png, .pdf, .docx, .txt"}
          </p>
          {errorMessage ? (
            <p className="font-sans text-[#9a3b36]">{errorMessage}</p>
          ) : null}
        </div>
      );
    }

    if (resolvedType === "DROPDOWN") {
      return (
        <div key={label} className="flex flex-col gap-[6px]">
          <label htmlFor={inputId} className="font-sans font-bold text-ink">{displayLabel}</label>
          {config?.description ? (
            <p className="font-sans text-ink-faint text-xs -mt-1">{config.description}</p>
          ) : null}
          <select
            id={inputId}
            value={value}
            aria-invalid={Boolean(errorMessage)}
            className={`h-[40px] rounded-[8px] border border-border-soft bg-[#faf9f6] px-[12px] font-sans text-ink outline-none ${
              errorMessage ? "ring-1 ring-[#9a3b36]/35" : ""
            }`}
            onChange={(e) => handleValueChange(label, e.target.value)}
            onBlur={() => scheduleDraftSave(fieldValuesRef.current, activeStep)}
          >
            <option value="">Select an option</option>
            {options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errorMessage ? (
            <p className="font-sans text-[#9a3b36]">{errorMessage}</p>
          ) : null}
        </div>
      );
    }

    if (resolvedType === "CHECKBOX") {
      const currentSelected: string[] = (() => {
        if (!value) return [];
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
        } catch {}
        return value.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
      })();

      const handleCheckboxToggle = (option: string) => {
        let updated: string[];
        if (currentSelected.includes(option)) {
          updated = currentSelected.filter((item) => item !== option);
        } else {
          updated = [...currentSelected, option];
        }
        const updatedVal = JSON.stringify(updated);
        handleValueChange(label, updatedVal);
        scheduleDraftSave(fieldValuesRef.current, activeStep);
      };

      return (
        <div key={label} className="flex flex-col gap-[6px]">
          <label className="font-sans font-bold text-ink">{displayLabel}</label>
          {config?.description ? (
            <p className="font-sans text-ink-faint text-xs -mt-1">{config.description}</p>
          ) : null}
          <div className="flex flex-col gap-2 pt-1">
            {options?.map((opt, optIdx) => {
              const isChecked = currentSelected.includes(opt);
              return (
                <label
                  key={`${opt}-${optIdx}`}
                  className="inline-flex items-center gap-2 style-mobile-body text-ink cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={opt}
                    checked={isChecked}
                    className="accent-brand h-4 w-4 rounded cursor-pointer"
                    onChange={() => handleCheckboxToggle(opt)}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
          {errorMessage ? (
            <p className="font-sans text-[#9a3b36]">{errorMessage}</p>
          ) : null}
        </div>
      );
    }

    const commonProps = {
      label: displayLabel,
      value,
      placeholder: config?.placeholder,
      "aria-invalid": Boolean(errorMessage),
      className: errorMessage ? "ring-1 ring-[#9a3b36]/35" : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleValueChange(label, event.target.value);
      },
      onBlur: () => {
        scheduleDraftSave(fieldValuesRef.current, activeStep);
      },
    };

    return (
      <div key={label} className="flex flex-col gap-[6px]">
        {resolvedType === "LONG_TEXT" ? (
          <FormTextarea {...commonProps} />
        ) : (
          <FormField {...commonProps} />
        )}
        {config?.description ? (
          <p className="font-sans text-ink-faint text-xs -mt-1">{config.description}</p>
        ) : null}
        {errorMessage ? (
          <p className="style-mobile-body text-[#9a3b36]">{errorMessage}</p>
        ) : null}
      </div>
    );
  }

  return (
    <MobileScreen backgroundColor={design.badgeBg }>
      <div className="mt-2 flex items-center">
        <Link
          href="/applications"
          className="style-caption leading-[16.8px] tracking-[0.2px]"
          style={{ color: design.badgeColor }}
        >
          ← Back to Applications
        </Link>
      </div>

      <div
        className="flex flex-col gap-[18px] rounded-[16px] bg-white p-[20px] transition-all duration-300 [filter:drop-shadow(0px_8px_11px_rgba(0,0,0,0.04))]"
        style={{ borderColor: design.borderColor, borderWidth: "1px" }}
      >
        <div className="flex items-start justify-between border-b pb-3" style={{ borderColor: design.borderColor }}>
          <div className="flex items-center gap-2.5">
            {design.image || design.iconUrl ? (
              <img
                src={design.image || design.iconUrl}
                alt={design.label}
                className="h-7 w-7 object-contain shrink-0"
              />
            ) : (
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs"
                style={{ backgroundColor: design.iconBg, color: design.iconColor }}
              >
                {typeof design.icon === "string" ? design.icon : "•"}
              </div>
            )}

            <div className="flex flex-col">
              <span
                className="inline-block w-fit rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase mb-0.5"
                style={{
                  backgroundColor: design.badgeBg,
                  color: design.badgeColor,
                  border: design.badgeBorder ? `1px solid ${design.badgeBorder}` : undefined,
                }}
              >
                {design.label}
              </span>
              <h1 className="style-mobile-title text-ink pb-2">
                {applicationTitle || "Application Form"}
              </h1>
              {Array.isArray(applicationLink) &&
              applicationLink.length > 0 ? (
                <div className="flex flex-col gap-1 pt-2 border-t border-border-soft">
                  <h2 className="style-section-header text-ink">
                    Reference Links for Application
                  </h2>
                  <FormattedLinks links={applicationLink} />
                  </div>
              ) : null}
            </div>
          </div>

          <SaveIndicator status={saveStatus} />
        </div>

        <FormStepper steps={layout.steps} active={activeStep} />

        <p className="style-mobile-body font-bold text-ink">
          {isReviewStep
            ? "Check every answer below before you submit. An application cannot be edited once it is submitted."
            : "* Please verify that the following information is correct"}
        </p>

        {alreadySubmitted && (
          <div className="rounded-[12px] bg-[#fbfaf7] border border-border-soft p-[12px] font-sans text-ink-muted">
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
              <div className="flex flex-col gap-[20px]">
                {layout.steps
                  .slice(0, layout.reviewStepIndex)
                  .map((step, stepIndex) => (
                    <div key={step} className="flex flex-col gap-[14px]">
                      <div className="flex items-center justify-between">
                        <p className="style-mobile-body font-bold text-ink">
                          {step}
                        </p>
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
                {(layout.stepFieldGroups[activeStep] ?? []).map((label) =>
                  renderField(label)
                )}
              </div>
            )}

            {submitError && (
              <p className="font-sans text-[#9a3b36]">{submitError}</p>
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
                aria-label={
                  activeStep >= layout.steps.length - 1
                    ? "Submit application"
                    : "Next step"
                }
                className="flex h-[42px] min-w-[88px] items-center justify-center rounded-[11px] bg-brand px-[16px] font-bold leading-none text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={
                  activeStep >= layout.steps.length - 1
                    ? () => setShowSubmitModal(true)
                    : handleNextStep
                }
                disabled={submitting || uploadingResume}
                onBlur={() => {
                  scheduleDraftSave(fieldValuesRef.current, activeStep);
                }}
              >
                {submitting
                  ? "Submitting..."
                  : activeStep >= layout.steps.length - 1
                  ? "Submit"
                  : "Next"}
              </button>
            </div>
          </>
        )}
      </div>

      {showSubmitModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl">
            <h3 className="style-section-header text-xl font-bold text-ink">
              Submit Your Application?
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              Are you sure you're ready to submit? You won't be able to edit
              your responses or uploaded files after finalizing your
              submission.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-border-soft px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-stone-100"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                Review Responses
              </button>

              <button
                type="button"
                className="flex h-10 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={async () => {
                  await handleSubmitApplication();
                  setShowSubmitModal(false);
                }}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav />
    </MobileScreen>
  );
}