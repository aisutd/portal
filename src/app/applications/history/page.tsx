"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";

type ApplicationHistoryResponse = {
  submissions: Array<{
    status: string;
    submittedAt: string;
    application: {
      title: string;
      retentionUntil: string | null;
    };
  }>;
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
    <div className="flex flex-col gap-[14px]">
      <div className="h-[96px] rounded-[16px] border border-border-soft bg-white animate-pulse" />
      <div className="h-[96px] rounded-[16px] border border-border-soft bg-white animate-pulse" />
      <div className="h-[96px] rounded-[16px] border border-border-soft bg-white animate-pulse" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[16px] border border-border-soft bg-white px-[25px] py-[22px] font-body text-[14px] leading-[20.3px] text-ink-muted">
      You have not submitted any applications yet.
    </div>
  );
}

export default function ApplicationHistoryPage() {
  const [submissions, setSubmissions] = useState<ApplicationHistoryResponse["submissions"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      setLoading(true);

      try {
        const response = await fetch("/api/me/applications", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load application history: ${response.status}`);
        }

        const payload = (await response.json()) as ApplicationHistoryResponse;
        setSubmissions(Array.isArray(payload.submissions) ? payload.submissions : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSubmissions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-cream">
      <Navbar active="Apply" />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[24px] px-[46px] pb-[46px] pt-[45px]">
        <section className="flex flex-col gap-[8px]">
          <h1 className="font-display text-[32px] font-bold leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
            Application History
          </h1>
          <p className="font-body text-[15px] leading-[21.75px] text-ink-muted">
            Review your past submissions and retention window.
          </p>
        </section>

        {loading ? (
          <LoadingState />
        ) : submissions.length > 0 ? (
          <div className="flex flex-col gap-[14px]">
            {submissions.map((submission, index) => (
              <article
                key={`${submission.application.title}-${submission.submittedAt}-${index}`}
                className="flex flex-col gap-[14px] rounded-[16px] border border-border-soft bg-white p-[25px]"
              >
                <div className="flex flex-col gap-[12px] sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-[8px]">
                    <h2 className="font-display text-[20px] font-semibold leading-[23.56px] text-ink [font-variation-settings:'wdth'_100]">
                      {submission.application.title}
                    </h2>
                    <p className="font-body text-[14px] leading-[20.3px] text-ink-muted">
                      Submitted {formatDateTime(submission.submittedAt)}
                    </p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(submission.status)}</div>
                </div>

                {submission.application.retentionUntil ? (
                  <p className="font-body text-[14px] leading-[20.3px] text-ink-muted">
                    Retention until {dateFormatter.format(new Date(submission.application.retentionUntil))}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
