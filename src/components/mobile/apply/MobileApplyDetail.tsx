"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { RoleCard, type Role } from "@/components/apply/role-card";

type RoleItem = string | Role;

type ApplicationDetailResponse = {
  application: {
    id: string;
    title: string;
    description: string;
    decisionDate: string | null;
    closeAt: string | null;
    phase: "open" | "upcoming" | "closed";
    eligibility: string[];
    roles: RoleItem[];
  };
  draft: {
    stepIndex: number;
    isSubmitted: boolean;
  } | null;
  submissionStatus: string | null;
  submissionId: string | null;
};

function formatDate(value: string | null, fallbackText: string) {
  if (!value) return fallbackText;

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

    switch (submissionStatus) {
      case "ACCEPTED":
        return <Badge label={label} bg="#d3eccf" color="#356b2e" />;
      case "REJECTED":
        return <Badge label={label} bg="#f9d5d3" color="#9a3b36" />;
      case "WAITLISTED":
        return <Badge label={label} bg="#fbe3cb" color="#7a4416" />;
      case "IN_REVIEW":
        return <Badge label={label} bg="#e1e8ff" color="#1f3aa3" />;
      case "IN_CONSIDERATION":
        return <Badge label={label} bg="#e9e5f6" color="#4b4178" />;
      case "COMPLETED":
      case "ARCHIVED":
        return <Badge label={label} bg="#efece3" color="#6a685f" />;
      default:
        return <Badge label={label} bg="#e1e8ff" color="#1f3aa3" />;
    }
  }

  if (draft) {
    return (
      <Badge
        label={draft.isSubmitted ? "Submitted" : "Draft"}
        variant="outline"
      />
    );
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

  const alreadySubmitted = Boolean(application?.submissionStatus);
  const isExpired = Boolean(
    application?.application.closeAt &&
      new Date(application.application.closeAt) < new Date()
  );

  const submissionId = application?.submissionId ?? null;
  // Normalize dynamic roles (handles strings or standard Role objects)
  const rawRoles = application?.application.roles ?? [];
  const normalizedRoles: Role[] = rawRoles.map((role) =>
    typeof role === "string" ? { title: role } : role
  );

  return (
    <MobileScreen>
      <Link href="/applications" className="style-caption text-brand">
        ← Back to Apply
      </Link>

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
              {formatDate(application.application.decisionDate, "Decision date TBD")}
            </p>
            <div className="flex items-center gap-[10px]">
              {getStatusBadge(application.draft, application.submissionStatus)}
              {alreadySubmitted ? (
                <span className="rounded-full border border-border-soft bg-[#efece3] px-[12px] py-[7px] style-caption text-ink-muted">
                  Already submitted
                </span>
              ) : isExpired ? (
                <span className="rounded-full border border-border-soft bg-[#efece3] px-[12px] py-[7px] style-caption text-ink-muted">
                  Application closed
                </span>
              ) : (
                <Button href={`/applications/form?id=${application.application.id}`} size="sm">
                  Apply
                </Button>
              )}
            </div>
          </div>

          {alreadySubmitted ? (
            <Button
              href={
                submissionId
                  ? `/applications/submitted?submissionId=${submissionId}`
                  : `/applications/submitted`
              }
              variant="ghost"
              size="lg"
              className="shrink-0 self-start sm:self-auto"
            >
              View Application
            </Button>
            ) : isExpired ? (
            <div className="rounded-[16px] border border-border-soft bg-[#fbfaf7] px-[16px] py-[12px] style-mobile-body text-ink-muted">
              Applications for this program closed on{" "}
              {formatDate(application.application.closeAt!, "")}.
            </div>
          ) : null}

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

          {normalizedRoles.length > 0 ? (
            <>
              <div className="flex items-center gap-[10px]">
                <h2 className="style-mobile-title text-ink">Roles</h2>
                <span className="h-[1.5px] min-w-px flex-1 bg-border-soft" />
              </div>

              {normalizedRoles.map((role, idx) => (
                <RoleCard key={role.title || idx} {...role} />
              ))}
            </>
          ) : null}
        </>
      ) : null}

      <BottomNav />
    </MobileScreen>
  );
}