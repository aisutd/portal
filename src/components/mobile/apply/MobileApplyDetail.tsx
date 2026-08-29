"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { applyDetailRoles } from "@/lib/data";

type ApplicationDetailResponse = {
  application: {
    id: string;
    title: string;
    description: string;
    decisionDate: string | null;
    phase: "open" | "upcoming" | "closed";
    eligibility: string[];
  };
  draft: {
    stepIndex: number;
    isSubmitted: boolean;
  } | null;
  submissionStatus: string | null;
};

function formatDecisionDate(value: string | null) {
  if (!value) {
    return "Decision date TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}

function getStatusBadge(
  draft: ApplicationDetailResponse["draft"],
  submissionStatus: string | null
) {
  if (submissionStatus) {
    const label = submissionStatus
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    if (submissionStatus === "ACCEPTED") return <Badge label={label} bg="#d3eccf" color="#356b2e" />;
    if (submissionStatus === "REJECTED") return <Badge label={label} bg="#f9d5d3" color="#9a3b36" />;
    if (submissionStatus === "WAITLISTED") return <Badge label={label} bg="#fbe3cb" color="#7a4416" />;
    if (submissionStatus === "IN_REVIEW") return <Badge label={label} bg="#e1e8ff" color="#1f3aa3" />;
    if (submissionStatus === "IN_CONSIDERATION") return <Badge label={label} bg="#e9e5f6" color="#4b4178" />;
    if (submissionStatus === "COMPLETED" || submissionStatus === "ARCHIVED")
      return <Badge label={label} bg="#efece3" color="#6a685f" />;

    return <Badge label={label} bg="#e1e8ff" color="#1f3aa3" />;
  }

  if (draft) {
    return <Badge label={draft.isSubmitted ? "Submitted" : "Draft"} variant="outline" />;
  }

  return null;
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex flex-col gap-[12px] rounded-[16px] border border-border-soft bg-white p-[20px]">
        <div className="h-[24px] w-[80%] rounded-full bg-[#f4f1ea]" />
        <div className="h-[14px] w-[50%] rounded-full bg-[#f4f1ea]" />
        <div className="h-[14px] w-[90%] rounded-full bg-[#f4f1ea]" />
      </div>
      <div className="h-[100px] rounded-[16px] border border-border-soft bg-white" />
      <div className="h-[100px] rounded-[16px] border border-border-soft bg-white" />
    </div>
  );
}

export function MobileApplyDetail() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");
  const [application, setApplication] = useState<ApplicationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const alreadySubmitted = Boolean(application?.submissionStatus);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplication() {
      if (!applicationId) {
        setApplication(null);
        setError("No application selected.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/applications/${applicationId}`, {
          signal: controller.signal,
        });

        if (response.status === 404) {
          setApplication(null);
          setError("Application not found.");
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load application: ${response.status}`);
        }

        const payload = (await response.json()) as ApplicationDetailResponse;
        setApplication(payload);
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") {
          setApplication(null);
          setError("Unable to load this application right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadApplication();

    return () => {
      controller.abort();
    };
  }, [applicationId]);

  return (
    <MobileScreen>
      <a href="/applications" className="style-caption text-brand">
        ← Back to Apply
      </a>

      {loading ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="rounded-[16px] border border-border-soft bg-white p-[20px] style-mobile-body text-ink-muted">
          {error}
        </div>
      ) : application ? (
        <>
          <div className="flex flex-col gap-[12px] rounded-[16px] border border-border-soft bg-white p-[20px]">
            <h1 className="style-mobile-title text-ink">
              {application.application.title}
            </h1>
            <p className="style-mobile-body text-ink-muted">
              {formatDecisionDate(application.application.decisionDate)}
            </p>
            <div className="flex items-center gap-[10px]">
              {getStatusBadge(application.draft, application.submissionStatus)}
              {alreadySubmitted ? (
                <span className="rounded-full border border-border-soft bg-[#efece3] px-[12px] py-[7px] style-caption text-ink-muted">
                  Already submitted
                </span>
              ) : (
                <Button href={`/applications/form?id=${application.application.id}`} size="sm">
                  Apply
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-[16px] rounded-[16px] border border-border-soft bg-white p-[20px]">
            <div className="flex flex-col gap-[6px]">
              <h2 className="style-mobile-title text-ink">
                Description
              </h2>
              <p className="style-mobile-body text-ink-muted">
                {application.application.description}
              </p>
            </div>

            {Array.isArray(application.application.eligibility) && application.application.eligibility.length > 0 ? (
              <div className="flex flex-col gap-[6px]">
                <h2 className="style-mobile-title text-ink">
                  Eligibility
                </h2>
                <ul className="flex list-disc flex-col gap-[4px] pl-[16px] style-mobile-body text-ink-muted">
                  {application.application.eligibility.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-[10px]">
            <h2 className="style-mobile-title text-ink">Roles</h2>
            <span className="h-[1.5px] min-w-px flex-1 bg-border-soft" />
          </div>

          {applyDetailRoles.map((role) => (
            <div
              key={role.title}
              className="flex flex-col gap-[10px] rounded-[16px] border border-border-soft bg-white p-[18px]"
            >
              <h3 className="style-mobile-title text-ink">
                {role.title}
              </h3>
              <p className="style-mobile-body text-ink-muted">
                {role.description}
              </p>
              <div className="flex flex-col gap-[6px]">
                {role.tagRows.map((row, i) => (
                  <div key={i} className="flex flex-wrap gap-[6px]">
                    {row.map((t) => (
                      <Tag key={t.label} label={t.label} bg={t.bg} color={t.color} border={t.border} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : null}

      <BottomNav />
    </MobileScreen>
  );
}
