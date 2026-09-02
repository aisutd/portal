"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReadOnlyField } from "@/components/apply/read-only-field";
import { SectionHeader } from "@/components/ui/section-header";
import { personalFields } from "@/lib/data";
import {
  EMPTY_LAYOUT,
  buildFormLayout,
  collectExtraAnswers,
  extractStringValues,
  toFieldValues,
  type ApplicationFormLayout,
  type FieldValues,
} from "@/lib/application-form";
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
      questions: string[];
    };
  };
};

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

function LoadingState() {
  return (
    <div className="flex flex-col gap-[20px]">
      <div className="h-[28px] w-[280px] rounded-full bg-[#efece3]" />
      <div className="h-[18px] w-[180px] rounded-full bg-[#f4f1ea]" />
      <div className="flex flex-col gap-[12px]">
        <div className="h-[18px] w-[180px] rounded-full bg-[#f4f1ea]" />
        <div className="grid grid-cols-1 gap-x-[28px] gap-y-[20px] sm:grid-cols-2">
          {personalFields.map((label) => (
            <div key={label} className="flex flex-col gap-[7px]">
              <div className="h-[14px] w-[120px] rounded-full bg-[#f4f1ea]" />
              <div className="h-[42px] rounded-[8px] bg-[#f4f1ea]" />
            </div>
          ))}
        </div>
      </div>
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

function SubmittedContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const [submission, setSubmission] = useState<
    SubmissionResponse["submission"] | null
  >(null);
  const [layout, setLayout] = useState<ApplicationFormLayout>(EMPTY_LAYOUT);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [extraAnswers, setExtraAnswers] = useState<Array<[string, string]>>([]);
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
        const nextLayout = buildFormLayout(
          payload.submission.application.questions,
        );
        const answers = payload.submission.formPayloadJson;

        setSubmission(payload.submission);
        setLayout(nextLayout);
        setFieldValues(
          toFieldValues(
            nextLayout.allFieldLabels,
            extractStringValues(nextLayout.allFieldLabels, answers),
          ),
        );
        setExtraAnswers(collectExtraAnswers(nextLayout.allFieldLabels, answers));
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
            <Link
              href="/applications"
              className="style-caption leading-[16.8px] tracking-[0.2px] text-brand"
            >
              ← Back to Applications
            </Link>
            <section className="flex flex-col gap-[14px] sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-[8px]">
                <h1 className="style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                  Submitted Application
                </h1>
                <p className="style-page-subtitle  leading-[21.75px] text-ink-muted">
                  View your submitted answers in read-only form.
                </p>
              </div>
              <div className="flex justify-between gap-[10px]">
                
                <Button href="/applications/history" variant="ghost" size="md">
                  View Other Submitted Applications
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
                    <h2 className="style-section-header leading-[28px] text-ink [font-variation-settings:'wdth'_100]">
                      {submission.application.title}
                    </h2>
                    <p className="style-body-text leading-[20.3px] text-ink-muted">
                      Submitted {formatDateTime(submission.submittedAt)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(submission.status)}
                  </div>
                </div>

                {submission.application.retentionUntil ? (
                  <p className="style-body-text leading-[20.3px] text-ink-muted">
                    Retention until{" "}
                    {dateFormatter.format(
                      new Date(submission.application.retentionUntil),
                    )}
                  </p>
                ) : null}

                {/* The review step shows no answers of its own. */}
                {layout.steps
                  .slice(0, layout.reviewStepIndex)
                  .map((step, index) => {
                  const fields = layout.stepFieldGroups[index] ?? [];

                  return (
                    <div key={step} className="flex flex-col gap-[14px]">
                      <SectionHeader title={step} />
                      <div className="grid grid-cols-1 gap-x-[28px] gap-y-[20px] sm:grid-cols-2">
                        {fields.map((label) => (
                          <ReadOnlyField
                            key={label}
                            label={label}
                            value={fieldValues[label] ?? ""}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Answers whose question is no longer on the application —
                    shown so a submitted answer is never silently dropped. */}
                {extraAnswers.length > 0 ? (
                  <div className="flex flex-col gap-[14px]">
                    <SectionHeader title="Other Answers" />
                    <div className="grid grid-cols-1 gap-x-[28px] gap-y-[20px] sm:grid-cols-2">
                      {extraAnswers.map(([label, value]) => (
                        <ReadOnlyField
                          key={label}
                          label={label}
                          value={value}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
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
