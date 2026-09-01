"use client";

import { type ChangeEvent, useEffect, useRef, useState, Suspense } from "react";
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
  isRequiredField,
  type ApplicationFormLayout,
  type FieldValues,
} from "@/lib/application-form";

// Aligned directly with admin/applications/new/page.tsx
export type QuestionType =
  | "TEXT"
  | "LONG_TEXT"
  | "DROPDOWN"
  | "CHECKBOX"
  | "FILE"
  // Fallback lowercase types for legacy/compat
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

type ApplicationResponse = {
  application: {
    title: string;
    questions: (string | QuestionConfig)[];
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
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  
  // FIXED: Declared at the top level of component
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  const saveTimerRef = useRef<number | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
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

        const rawQuestions = applicationPayload?.application.questions ?? [];
        const qMap: Record<string, QuestionConfig> = {};
        const normalizedLabels: string[] = [];

        rawQuestions.forEach((q) => {
          if (typeof q === "string") {
            qMap[q] = { label: q, type: "TEXT" };
            normalizedLabels.push(q);
          } else if (q && typeof q === "object" && q.label) {
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

            qMap[q.label] = {
              ...q,
              type: normalizedType,
            };
            normalizedLabels.push(q.label);
          }
        });

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
      // Fail silently in background
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

      handleValueChange("Resume *", file.name);
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

      // Save JSON string with the user's original file.name
      const filePayload = JSON.stringify({
        fileName: file.name, // Preserves exact original user file name
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
                Back to applications
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function persistDraft(nextValues: FieldValues, nextStepIndex: number) {
    if (!applicationId) return;

    await fetch(`/api/applications/${applicationId}/draft`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formPayloadJson: nextValues,
        stepIndex: nextStepIndex,
      }),
    });
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

    if (fieldErrors[label]) {
      setFieldErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors[label];
        return nextErrors;
      });
    }

    if (personalFields.includes(label)) {
      patchProfileValues(label, value);
    }
  }

  function renderField(label: string) {
    const value = fieldValues[label] ?? "";
    const errorMessage = fieldErrors[label];
    const inputId = `f-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const config = questionsMap[label];
    const required = isRequiredField(label, questionsMap);
    const displayLabel = required && !label.includes("*") ? `${label} *` : label;

    const cleanLabel = label.replace(/\s*\*$/, "");
    const rawType = String(config?.type || "").toUpperCase().trim();

    let resolvedType: QuestionType = "TEXT";
    let options = config?.options;

    // Direct Predefined Profile Overrides
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

    // FILE FIELD (Interactive)
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

            {/* Display File Capsule */}
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

    // DROPDOWN FIELD (Interactive)
    if (resolvedType === "DROPDOWN") {
      return (
        <div key={label} className="flex flex-col gap-1.5">
          <label htmlFor={inputId} className="style-label-text text-ink-muted font-medium">
            {displayLabel}
          </label>
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
      const currentSelected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

      const handleCheckboxToggle = (option: string) => {
        let updated: string[];
        if (currentSelected.includes(option)) {
          updated = currentSelected.filter((item) => item !== option);
        } else {
          updated = [...currentSelected, option];
        }
        const updatedVal = updated.join(", ");
        handleValueChange(label, updatedVal);
        scheduleDraftSave(fieldValuesRef.current, activeStep);
      };

      return (
        <div key={label} className="flex flex-col gap-2">
          <label className="style-label-text text-ink-muted">{displayLabel}</label>
          <div className="flex flex-col gap-2">
            {options?.map((opt) => (
              <label key={opt} className="inline-flex items-center gap-2 style-body-text text-ink cursor-pointer">
                <input
                  type="checkbox"
                  value={opt}
                  checked={currentSelected.includes(opt)}
                  className="accent-brand h-4 w-4 rounded"
                  onChange={() => handleCheckboxToggle(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
          {errorMessage ? (
            <p className="style-caption text-[#9a3b36]">{errorMessage}</p>
          ) : null}
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
        {errorMessage ? (
          <p className="style-caption text-[#9a3b36]">{errorMessage}</p>
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

          <div className="flex w-full flex-col items-center px-10 pt-8 pb-32">
            <div className="w-full max-w-[1346px] rounded-2xl border border-border-soft bg-white p-9 shadow-sm">
              <div className="flex flex-col gap-6">
                <h1 className="style-page-title text-ink">
                  {applicationTitle ?? "Application"}
                </h1>

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
                                      config={questionsMap[label]}
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

                    {/* Navigation Bar */}
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
                            ? handleSubmitApplication
                            : handleNextStep
                        }
                        disabled={submitting || uploadingResume}
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