"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { SectionHeader } from "@/components/ui/section-header";
import { applicationFormStepFields, applicationSteps } from "@/lib/data";
import { MobileSubmitted } from "@/components/mobile/apply/MobileSubmitted";

type SubmissionResponse = {
  submission: {
    id: string;
    status: string;
    submittedAt: string;
    formPayloadJson: unknown;
    application: {
      title: string;
      retentionUntil: string | null;
    };
  };
};

type FieldValues = Record<string, string>;

const stepFieldGroups: string[][] = applicationFormStepFields;
const allFieldLabels = stepFieldGroups.flat();

const DEFAULT_FIELD_VALUES: FieldValues = allFieldLabels.reduce(
  (acc, field) => {
    acc[field] = "";
    return acc;
  },
  {} as FieldValues,
);

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Chicago",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Chicago",
  timeZoneName: "short",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
}

function getStatusBadge(status: string) {
  const label = status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (status === "ACCEPTED") {
    return <Badge label={label} bg="#d3eccf" color="#356b2e" />;
  }

  if (status === "REJECTED") {
    return <Badge label={label} bg="#f9d5d3" color="#9a3b36" />;
  }

  if (status === "WAITLISTED") {
    return <Badge label={label} bg="#fbe3cb" color="#7a4416" />;
  }

  if (status === "IN_REVIEW") {
    return <Badge label={label} bg="#e1e8ff" color="#1f3aa3" />;
  }

  if (status === "IN_CONSIDERATION") {
    return <Badge label={label} bg="#e9e5f6" color="#4b4178" />;
  }

  if (status === "COMPLETED" || status === "ARCHIVED") {
    return <Badge label={label} bg="#efece3" color="#6a685f" />;
  }

  return <Badge label={label} bg="#e1e8ff" color="#1f3aa3" />;
}

function toFieldValues(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return DEFAULT_FIELD_VALUES;
  }

  const record = payload as Record<string, unknown>;

  return allFieldLabels.reduce(
    (acc, field) => {
      const value = record[field];
      acc[field] = typeof value === "string" ? value : "";
      return acc;
    },
    { ...DEFAULT_FIELD_VALUES },
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-[20px]">
      <div className="h-[28px] w-[280px] rounded-full bg-[#efece3]" />
      <div className="h-[18px] w-[180px] rounded-full bg-[#f4f1ea]" />
      {applicationSteps.map((step, stepIndex) => (
        <div key={step} className="flex flex-col gap-[12px]">
          <div className="h-[18px] w-[180px] rounded-full bg-[#f4f1ea]" />
          <div className="grid grid-cols-1 gap-x-[28px] gap-y-[20px] sm:grid-cols-2">
            {stepFieldGroups[stepIndex]?.map((label) => (
              <div key={label} className="flex flex-col gap-[7px]">
                <div className="h-[14px] w-[120px] rounded-full bg-[#f4f1ea]" />
                <div className="h-[42px] rounded-[8px] bg-[#f4f1ea]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotFoundState({ message }: { message: string }) {
  return (
    <div className="rounded-[18px] border border-border-soft bg-white p-[35px] style-body-text  leading-[20.3px] text-ink-muted">
      {message}
    </div>
  );
}

function renderReadOnlyField(label: string, value: string) {
  const commonProps = {
    label,
    value,
    readOnly: true,
    tabIndex: -1,
    className: "cursor-default",
  };

  if (
    label === "Why do you want to join AIS? *" ||
    label === "What skills or experience do you bring? *" ||
    label === "Anything else you'd like the reviewers to know?"
  ) {
    return (
      <FormTextarea
        key={label}
        {...commonProps}
        className="cursor-default h-[140px]"
      />
    );
  }

  if (label === "Resume *") {
    return (
      <div key={label} className="flex w-full flex-col gap-[7px]">
        <label className="font-body  font-bold leading-[20.3px] text-ink-muted">
          {label}
        </label>
        <a
          href="/api/profile/resume/download"
          className="flex h-[42px] w-full items-center rounded-[8px] bg-search-field px-[14px] font-mono  text-search-ink transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
          title={value}
        >
          <span className="truncate">{value || "Download resume"}</span>
        </a>
      </div>
    );
  }

  return <FormField key={label} {...commonProps} />;
}

function SubmittedContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const [submission, setSubmission] = useState<
    SubmissionResponse["submission"] | null
  >(null);
  const [fieldValues, setFieldValues] =
    useState<FieldValues>(DEFAULT_FIELD_VALUES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSubmission() {
      if (!submissionId) {
        setSubmission(null);
        setError("No submission selected.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/applications/submissions/${submissionId}`,
          {
            signal: controller.signal,
          },
        );

        if (response.status === 404) {
          setSubmission(null);
          setError("Submission not found.");
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load submission: ${response.status}`);
        }

        const payload = (await response.json()) as SubmissionResponse;
        setSubmission(payload.submission);
        setFieldValues(toFieldValues(payload.submission.formPayloadJson));
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") {
          setSubmission(null);
          setError("Unable to load this submission right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSubmission();

    return () => {
      controller.abort();
    };
  }, [submissionId]);

  return (
    <>
      <div className="md:hidden">
        <MobileSubmitted />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar active="Apply" />

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[24px] px-[46px] pb-[46px] pt-[45px]">
            <section className="flex flex-col gap-[14px] sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-[8px]">
                <h1 className="font-display  font-bold leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                  Submitted Application
                </h1>
                <p className="style-page-subtitle  leading-[21.75px] text-ink-muted">
                  View your submitted answers in read-only form.
                </p>
              </div>
              <div className="flex flex-wrap gap-[10px]">
                <Button href="/applications/history" variant="ghost" size="md">
                  View History
                </Button>
                <Button href="/applications" variant="primary" size="md">
                  Back to Applications
                </Button>
              </div>
            </section>

            {loading ? (
              <LoadingState />
            ) : error ? (
              <NotFoundState message={error} />
            ) : submission ? (
              <div className="flex flex-col gap-[20px] rounded-[18px] border border-border-soft bg-white p-[35px]">
                <div className="flex flex-col gap-[12px] sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-[6px]">
                    <h2 className="font-display  font-semibold leading-[28px] text-ink [font-variation-settings:'wdth'_100]">
                      {submission.application.title}
                    </h2>
                    <p className="font-body  leading-[20.3px] text-ink-muted">
                      Submitted {formatDateTime(submission.submittedAt)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(submission.status)}
                  </div>
                </div>

                {submission.application.retentionUntil ? (
                  <p className="font-body  leading-[20.3px] text-ink-muted">
                    Retention until{" "}
                    {dateFormatter.format(
                      new Date(submission.application.retentionUntil),
                    )}
                  </p>
                ) : null}

                {applicationSteps.map((step, index) => {
                  const fields = stepFieldGroups[index] ?? [];

                  return (
                    <div key={step} className="flex flex-col gap-[14px]">
                      <SectionHeader title={step} />
                      <div className="grid grid-cols-1 gap-x-[28px] gap-y-[20px] sm:grid-cols-2">
                        {fields.map((label) =>
                          renderReadOnlyField(label, fieldValues[label] ?? ""),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

function SubmittedFallback() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-cream">
      <Navbar active="Apply" />
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[24px] px-[46px] pb-[46px] pt-[45px]">
        <LoadingState />
      </div>
    </div>
  );
}

export default function SubmittedPage() {
  return (
    <Suspense fallback={<SubmittedFallback />}>
      <SubmittedContent />
    </Suspense>
  );
}
