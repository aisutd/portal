"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useRef, useState, Suspense } from "react";
import { PROGRAM_TYPE_CONFIG, DEFAULT_PROGRAM_TYPE_DESIGN, type ProgramTypeDesign } from "@/lib/program-types"; // Update path as needed
import { ProgramType } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { FormStepper } from "@/components/apply/form-stepper";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { ReadOnlyField } from "@/components/apply/read-only-field";
import { SectionHeader } from "@/components/ui/section-header";
import { MobileApplyForm } from "@/components/mobile/apply/MobileApplyForm";
import { personalFields } from "@/lib/data";
import { uploadResumeAction } from "@/app/profile/resume";
import { UTD_MAJORS, UTD_DEGREES, ACADEMIC_YEARS } from "@/lib/utd-data";
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
    title: string;
    link: string[];
    questions: (string | QuestionConfig)[];
    requiredProfileFields?: RequiredProfileFields;
    programType?: ProgramType | string;
  };
  submissionStatus: string | null;
};

type FieldErrors = Record<string, string>;

const RESUME_ACCEPT =
  ".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf";

function profileToFieldValues(
  profile: ProfileResponse["profile"],
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

export function getProgramDesign(programType?: ProgramType | string | null): ProgramTypeDesign {
  if (!programType) return DEFAULT_PROGRAM_TYPE_DESIGN;
  const key = programType as ProgramType;
  return PROGRAM_TYPE_CONFIG[key] || DEFAULT_PROGRAM_TYPE_DESIGN;
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-72 rounded-full bg-[#f4f1ea]" />
      <div className="h-12 w-full rounded-xl border border-border-soft bg-white" />
      <div className="h-5 w-48 rounded-full bg-[#f4f1ea]" />
      <div className="grid grid-cols-1 gap-x-7 gap-y-5 sm:grid-cols-2">
        {personalFields.map((label) => (
          <div key={label} className="flex flex-col gap-2">
            <div className="h-4 w-28 rounded-full bg-[#f4f1ea]" />
            <div className="h-11 rounded-lg bg-[#f4f1ea]" />
          </div>
        ))}
      </div>
      <div className="flex w-full justify-between pt-4">
        <div className="h-11 w-24 rounded-xl bg-[#f4f1ea]" />
        <div className="h-11 w-24 rounded-xl bg-[#f4f1ea]" />
      </div>
    </div>
  );
}

function NotFoundState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-8 style-body-text text-ink-muted">
      {message}
    </div>
  );
}

function ApplyFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get("id");
  const [layout, setLayout] = useState<ApplicationFormLayout>(EMPTY_LAYOUT);
  const [questionsMap, setQuestionsMap] = useState<Record<string, QuestionConfig>>({});
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [applicationTitle, setApplicationTitle] = useState<string | null>(null);
  const [applicationLink, setApplicationLink] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [programType, setProgramType] = useState<ProgramType | string | null>(null);

  const saveTimerRef = useRef<number | null>(null);
  const fieldValuesRef = useRef<FieldValues>({});
  const isReviewStep = activeStep === layout.reviewStepIndex;

  const GENERIC_FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf,.docx,.txt,image/jpeg,image/png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
  const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf", "docx", "txt"];

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
        
        // Inside your loadData() fetch logic:
        setApplicationTitle(applicationPayload?.application?.title ?? null);
        setProgramType(applicationPayload?.application?.programType ?? null); // Save programType to state
        setApplicationLink(applicationPayload?.application?.link ?? []);
        console.log(applicationLink);
        // Extract raw data with null coalescing to protect against missing properties
        const rawQuestions = applicationPayload?.application?.questions ?? [];
        const rawRequirements = applicationPayload?.application?.requiredProfileFields as
          | Record<string, boolean>
          | undefined;

        const qMap: Record<string, QuestionConfig> = {};
        const normalizedLabels: string[] = [];

        // Map profile field dynamic requirements directly from Prisma JSON
        if (rawRequirements) {
          const profileMap: Record<string, boolean | undefined> = {
            "Phone Number": rawRequirements.requirePhoneNumber,
            "Personal Email": rawRequirements.requirePersonalEmail,
            "Resume": rawRequirements.requireResume,
            "LinkedIn": rawRequirements.requireLinkedin,
            "GitHub": rawRequirements.requireGithub,
            "Portfolio": rawRequirements.requirePortfolio,
          };

          Object.entries(profileMap).forEach(([fieldLabel, isRequired]) => {
            const config = { label: fieldLabel, required: Boolean(isRequired) };
            qMap[fieldLabel] = config;
            qMap[`${fieldLabel} *`] = config;
          });
        }

        // Process custom dynamic application questions
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
            } else if (
              rawType === "CHECKBOX" ||
              rawType === "MULTISELECT"
            ) {
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

        // Update state if request wasn't aborted
        if (!controller.signal.aborted) {
          setQuestionsMap(qMap);

          const nextLayout = buildFormLayout(normalizedLabels);
          setLayout(nextLayout);

          const mergedValues = {
            ...profileToFieldValues(profilePayload.profile),
            ...extractStringValues(
              nextLayout.allFieldLabels,
              draftPayload.draft?.formPayloadJson,
            ),
          };

          const nextValues = toFieldValues(nextLayout.allFieldLabels, mergedValues);
          setFieldValues(nextValues);
          fieldValuesRef.current = nextValues;

          setActiveStep(
            draftPayload.draft
              ? Math.min(
                  Math.max(draftPayload.draft.stepIndex, 0),
                  nextLayout.steps.length - 1,
                )
              : 0,
          );
          setAlreadySubmitted(Boolean(applicationPayload?.submissionStatus));
          setApplicationTitle(applicationPayload?.application?.title ?? null);
          setApplicationLink(applicationPayload?.application?.link ?? []);

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
            <span className="text-emerald-700">All changes saved</span>
          </>
        )}
      </div>
    );
  }

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
      // Background patch silently fails
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

  if (!loading && !error && alreadySubmitted) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-cream">
        <Navbar active="Apply" />
        <div className="flex w-full flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[720px] rounded-2xl border border-border-soft bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="inline-flex w-fit rounded-full bg-[#efece3] px-3.5 py-1 text-xs font-semibold text-ink-muted">
                Already submitted
              </div>
              <h1 className="style-page-title text-ink">
                {applicationTitle ?? "Application"}
              </h1>
              <p className="max-w-[560px] style-page-subtitle text-ink-muted">
                You have already submitted an application for this program.
              </p>
              <button
                type="button"
                className="inline-flex h-11 w-fit items-center justify-center rounded-xl bg-brand px-5 font-bold text-white transition-opacity hover:opacity-95"
                onClick={() => router.push("/applications")}
              >
                ← Back to Applications
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
      questionsMap,
    );

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      const errorStep = findFirstStepWithError(
        layout.stepFieldGroups,
        nextErrors,
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

      const response = await fetch(
        `/api/applications/${applicationId}/submit`,
        { method: "POST" },
      );

      if (!response.ok) {
        if (response.status === 409) {
          setSubmitError("You have already submitted an application for this program.");
          return;
        }

        const payload = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;

        setSubmitError(
          payload?.error?.message ?? "Some answers are missing or incorrectly formatted."
        );
        return;
      }

      const payload = await response.json();
      router.push(`/applications/submitted?submissionId=${payload.submission.id}`);
    } catch {
      setSubmitError("Unable to submit your application right now.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleValueChange(label: string, value: string) {
    const nextValues = {
      ...fieldValuesRef.current,
      [label]: value,
    };
    fieldValuesRef.current = nextValues;
    setFieldValues(nextValues);
    setSaveStatus("saving");

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

  function renderField(label: string) {
    const value = fieldValues[label] ?? "";
    const cleanLabel = normalizeFieldLabel(label);
    const errorMessage = fieldErrors[cleanLabel] || fieldErrors[label];;
    const inputId = `f-${label.toLowerCase().replace(/\s+/g, "-")}`;
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
      const isUploading = isProfileResume ? uploadingResume : Boolean(uploadingFields[label]);

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
        <div key={label} className="flex flex-col gap-1.5">
          <label htmlFor={inputId} className="style-label-text text-ink-muted font-medium">
            {displayLabel}
          </label>
          {config?.description ? (
            <p className="style-caption text-ink-faint -mt-0.5">{config.description}</p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id={inputId}
              type="file"
              accept={acceptTypes}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                const extension = file.name.split(".").pop()?.toLowerCase();
                const validTypes = isProfileResume ? ["pdf", "doc", "docx"] : ALLOWED_EXTENSIONS;

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

            <button
              type="button"
              disabled={isUploading}
              className="flex h-11 items-center justify-center rounded-xl border border-border-soft bg-white px-4 text-sm font-semibold text-ink shadow-xs transition-all hover:border-brand/40 hover:bg-[#fbfaf7] active:scale-[0.99] disabled:opacity-50"
              onClick={(e) => {
                const container = e.currentTarget.parentElement;
                const fileInput = container?.querySelector<HTMLInputElement>(`input[type="file"]`);
                fileInput?.click();
              }}
            >
              {isUploading ? "Uploading..." : "Upload file"}
            </button>

            {displayFileName ? (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-border-soft bg-[#fbfaf7] px-3.5 text-sm text-ink truncate">
                <svg className="h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {fileUrl ? (
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-brand hover:underline">
                    {displayFileName}
                  </a>
                ) : (
                  <span className="truncate">{displayFileName}</span>
                )}
              </div>
            ) : (
              <span className="style-caption text-ink-faint">No file selected</span>
            )}
          </div>

          <p className="style-caption text-ink-faint">
            {isProfileResume ? "Accepted formats: .doc, .docx, .pdf (Max 10MB)" : "Accepted formats: .jpg, .png, .pdf, .docx, .txt (Max 10MB)"}
          </p>
          {errorMessage ? <p className="style-caption text-[#9a3b36]">{errorMessage}</p> : null}
        </div>
      );
    }

    if (resolvedType === "DROPDOWN") {
      return (
        <div key={label} className="flex flex-col gap-1.5">
          <label htmlFor={inputId} className="style-label-text text-ink-muted font-medium">
            {displayLabel}
          </label>
          {config?.description ? (
            <p className="style-caption text-ink-faint -mt-0.5">{config.description}</p>
          ) : null}
          <select
            id={inputId}
            value={value}
            aria-invalid={Boolean(errorMessage)}
            className={`h-11 rounded-xl border border-border-soft bg-[#faf9f6] px-3.5 style-body-text text-ink outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 ${
              errorMessage ? "border-[#9a3b36] focus:ring-[#9a3b36]/20" : ""
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
          {errorMessage ? <p className="style-caption text-[#9a3b36]">{errorMessage}</p> : null}
        </div>
      );
    }

    if (resolvedType === "CHECKBOX") {
      // Filter out empty strings so index 0 doesn't get matched against [""]
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
        <div key={label} className="flex flex-col gap-2">
          <label className="style-label-text text-ink-muted font-medium">{displayLabel}</label>
          {config?.description ? (
            <p className="style-caption text-ink-faint -mt-1">{config.description}</p>
          ) : null}
          <div className="flex flex-col gap-2 pt-1">
            {options?.map((opt, optIdx) => {
              const isChecked = currentSelected.includes(opt);
              return (
                <label key={`${opt}-${optIdx}`} className="inline-flex items-center gap-2 style-body-text text-ink cursor-pointer">
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
          {errorMessage ? <p className="style-caption text-[#9a3b36]">{errorMessage}</p> : null}
        </div>
      );
    }
    const commonProps = {
      label: displayLabel,
      value,
      placeholder: config?.placeholder,
      "aria-invalid": Boolean(errorMessage),
      className: errorMessage ? "border-[#9a3b36]" : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleValueChange(label, event.target.value);
      },
      onBlur: () => {
        scheduleDraftSave(fieldValuesRef.current, activeStep);
      },
    };

    return (
      <div key={label} className={`flex flex-col gap-1.5 ${resolvedType === "LONG_TEXT" ? "col-span-1 sm:col-span-2" : ""}`}>
        {resolvedType === "LONG_TEXT" ? (
          <FormTextarea {...commonProps} />
        ) : (
          <FormField {...commonProps} />
        )}
        {config?.description ? (
          <p className="style-caption text-ink-faint -mt-1">{config.description}</p>
        ) : null}
        {errorMessage ? (
          <p className="style-caption text-[#9a3b36]">{errorMessage}</p>
        ) : null}
      </div>
    );
  }

  const design = getProgramDesign(programType);

  return (
    <>
    <div className="md:hidden">
      <MobileApplyForm />
    </div>

    <div className="hidden md:block">
      {/* Dynamic page background matching badge/icon color or fallback */}
      <div 
        className="flex min-h-screen w-full flex-col transition-colors duration-300" 
        style={{ backgroundColor: design.badgeBg }}
      >
        <Navbar active="Apply" />
        
        <div className="flex w-full flex-col items-center px-10 pt-8 pb-32">
          <div className="flex w-full px-32 mb-6">
            <Link
              href="/applications"
              className="style-caption leading-[16.8px] tracking-[0.2px]"
              style={{ color: design.badgeColor }}
            >
              ← Back to Applications
            </Link>
          </div>

          {/* Form container border dynamic based on program type */}
          <div 
            className="w-full max-w-[1346px] rounded-2xl bg-white p-9 shadow-sm transition-all duration-300"
            style={{ borderColor: design.borderColor, borderWidth: "1px" }}
          >
            <div className="flex flex-col gap-6">
              
              {/* Dynamic Header with Program Logo/Icon */}
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: design.borderColor }}>
                <div className="flex items-center gap-3">
                  {/* Dynamic Logo Image or Icon Badge */}
                  {design.image || design.iconUrl ? (
                    <img 
                      src={design.image || design.iconUrl} 
                      alt={design.label} 
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <div 
                      className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm"
                      style={{ backgroundColor: design.iconBg, color: design.iconColor }}
                    >
                      {typeof design.icon === "string" ? design.icon : "•"}
                    </div>
                  )}

                  <div>
                    <span 
                      className="inline-block rounded-md px-2 py-0.5 text-xs font-bold tracking-wide uppercase mb-1"
                      style={{ 
                        backgroundColor: design.badgeBg, 
                        color: design.badgeColor,
                        border: design.badgeBorder ? `1px solid ${design.badgeBorder}` : undefined
                      }}
                    >
                      {design.label}
                    </span>
                    <h1 className="style-page-title text-ink pb-2">
                      {applicationTitle ?? "Application"}
                    </h1>
                    {Array.isArray(applicationLink) &&
                    applicationLink.length > 0 ? (
                      <div className="flex flex-col gap-1 pt-2 border-t border-border-soft">
                        <h2 className="style-body-text text-ink">
                          Reference Links for Application
                        </h2>
                          {applicationLink.map((url, idx) => (
                            <li key={url} className="flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="style-body-text text-brand hover:underline"
                              >
                                {url}
                              </a>
                            </li>
                          ))}
                        </div>
                    ) : null}
                  </div>
                </div>
                <SaveIndicator status={saveStatus} />
              </div>
              
              <FormStepper steps={layout.steps} active={activeStep} />

                <p className="style-body-text text-ink-muted">
                  {isReviewStep
                    ? "Check every answer below before you submit. An application cannot be edited once submitted."
                    : "* Please verify that the following information is correct"}
                </p>

                {loading ? (
                  <LoadingState />
                ) : error ? (
                  <NotFoundState message={error} />
                ) : (
                  <>
                    {isReviewStep ? (
                      <div className="flex flex-col gap-6">
                        {layout.steps
                          .slice(0, layout.reviewStepIndex)
                          .map((step, stepIndex) => (
                            <div key={step} className="flex flex-col gap-3.5">
                              <SectionHeader
                                title={step}
                                action={
                                  <button
                                    type="button"
                                    aria-label={`Edit ${step}`}
                                    className="style-body-text text-brand underline underline-offset-4 hover:opacity-80"
                                    onClick={() => handleEditStep(stepIndex)}
                                  >
                                    Edit
                                  </button>
                                }
                              />
                              <div className="grid grid-cols-1 gap-x-7 gap-y-5 sm:grid-cols-2">
                                {(layout.stepFieldGroups[stepIndex] ?? []).map(
                                  (label) => (
                                    <ReadOnlyField
                                      key={label}
                                      label={label}
                                      value={fieldValues[label] ?? ""}
                                      config={questionsMap[label.replace(/\s*\*$/, "")] || questionsMap[label]}
                                    />
                                  ),
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-x-7 gap-y-5 sm:grid-cols-2">
                        {(layout.stepFieldGroups[activeStep] ?? []).map((label) =>
                          renderField(label),
                        )}
                      </div>
                    )}

                    {submitError ? (
                      <p className="style-body-text text-[#9a3b36]">{submitError}</p>
                    ) : null}

                    <div className="flex w-full justify-between pt-4">
                      <button
                        type="button"
                        className="flex h-11 items-center justify-center rounded-xl border border-border-soft bg-white px-5 style-body-text text-ink-muted transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handleBackStep}
                        disabled={activeStep === 0}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="flex h-11 min-w-[96px] items-center justify-center rounded-xl bg-brand px-5 font-bold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={
                          activeStep >= layout.steps.length - 1
                            ? () => setShowSubmitModal(true)
                            : handleNextStep
                        }
                        disabled={submitting || uploadingResume}
                      >
                        {submitting
                          ? "Submitting..."
                          : activeStep >= layout.steps.length - 1
                            ? "Submit Application"
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
      {showSubmitModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl">
            <h3 className="style-section-header text-xl font-bold text-ink">
              Submit Your Application?
            </h3>
            
            <p className="mt-2 text-sm text-ink-muted">
              Are you sure you're ready to submit? You won't be able to edit your responses or uploaded files after finalizing your submission.
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
    </>
  );
}

function ApplyFormFallback() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-cream">
      <Navbar active="Apply" />
      <div className="flex w-full flex-col items-center px-10 pt-8 pb-32">
        <div className="w-full max-w-[1346px] rounded-2xl border border-border-soft bg-white p-9 shadow-sm">
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