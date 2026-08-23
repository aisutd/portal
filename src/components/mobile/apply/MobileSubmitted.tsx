"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { personalFields } from "@/lib/data";

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

type FieldValues = Record<(typeof personalFields)[number], string>;

const DEFAULT_FIELD_VALUES: FieldValues = personalFields.reduce(
  (acc, field) => {
    acc[field] = "";
    return acc;
  },
  {} as FieldValues
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

  if (status === "ACCEPTED") return <Badge label={label} bg="#d3eccf" color="#356b2e" />;
  if (status === "REJECTED") return <Badge label={label} bg="#f9d5d3" color="#9a3b36" />;
  if (status === "WAITLISTED") return <Badge label={label} bg="#fbe3cb" color="#7a4416" />;
  if (status === "IN_REVIEW") return <Badge label={label} bg="#e1e8ff" color="#1f3aa3" />;
  if (status === "IN_CONSIDERATION") return <Badge label={label} bg="#e9e5f6" color="#4b4178" />;
  if (status === "COMPLETED" || status === "ARCHIVED")
    return <Badge label={label} bg="#efece3" color="#6a685f" />;

  return <Badge label={label} bg="#e1e8ff" color="#1f3aa3" />;
}

function toFieldValues(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return DEFAULT_FIELD_VALUES;
  }

  const record = payload as Record<string, unknown>;

  return personalFields.reduce((acc, field) => {
    const value = record[field];
    acc[field] = typeof value === "string" ? value : "";
    return acc;
  }, { ...DEFAULT_FIELD_VALUES });
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="h-[22px] w-[70%] rounded-full bg-[#efece3]" />
      <div className="h-[14px] w-[50%] rounded-full bg-[#f4f1ea]" />
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

export function MobileSubmitted() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const [submission, setSubmission] = useState<SubmissionResponse["submission"] | null>(null);
  const [fieldValues, setFieldValues] = useState<FieldValues>(DEFAULT_FIELD_VALUES);
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
        const response = await fetch(`/api/applications/submissions/${submissionId}`, {
          signal: controller.signal,
        });

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
    <MobileScreen>
      <div className="flex flex-col gap-[6px]">
        <h1 className="font-mobile-display text-[20px] font-bold text-ink">
          Submitted Application
        </h1>
        <p className="font-mobile-body text-[13px] text-ink-muted">
          View your submitted answers in read-only form.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <NotFoundState message={error} />
      ) : submission ? (
        <div className="flex flex-col gap-[16px] rounded-[16px] border border-border-soft bg-white p-[20px]">
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-start justify-between gap-[10px]">
              <h2 className="font-mobile-display text-[16px] font-bold text-ink">
                {submission.application.title}
              </h2>
              <div className="shrink-0">{getStatusBadge(submission.status)}</div>
            </div>
            <p className="font-mobile-body text-[12px] text-ink-muted">
              Submitted {formatDateTime(submission.submittedAt)}
            </p>
          </div>

          {submission.application.retentionUntil ? (
            <p className="font-mobile-body text-[12px] text-ink-muted">
              Retention until{" "}
              {dateFormatter.format(new Date(submission.application.retentionUntil))}
            </p>
          ) : null}

          <div className="flex flex-col gap-[14px]">
            {personalFields.map((label) =>
              label === "Resume *" ? (
                <div key={label} className="flex flex-col gap-[6px]">
                  <label className="font-mobile-body text-[13px] font-bold text-ink">
                    {label}
                  </label>
                  <a
                    href="/api/profile/resume/download"
                    className="flex h-[40px] items-center rounded-[10px] bg-field px-[13px] font-mono text-[11px] text-ink transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
                    title={fieldValues[label]}
                  >
                    <span className="truncate">
                      {fieldValues[label] || "Download resume"}
                    </span>
                  </a>
                </div>
              ) : (
                <FormField
                  key={label}
                  label={label}
                  value={fieldValues[label]}
                  readOnly
                  tabIndex={-1}
                  className="cursor-default"
                />
              ),
            )}
          </div>
        </div>
      ) : null}

      <BottomNav />
    </MobileScreen>
  );
}
