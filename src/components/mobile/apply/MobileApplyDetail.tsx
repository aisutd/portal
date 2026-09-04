"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { RoleCard, type Role } from "@/components/apply/role-card";
import { FormattedLinks } from "@/components/ui/formatted-link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

type RoleItem = string | Role;

type ApplicationDetailResponse = {
  application: {
    id: string;
    title: string;
    description: string;
    decisionDate: string | null;
    openAt?: string | null;
    closeAt: string | null;
    phase: "open" | "upcoming" | "closed";
    eligibility: string[];
    link: string[];
    roles: RoleItem[];
  };
  draft: {
    stepIndex: number;
    isSubmitted: boolean;
  } | null;
  submissionStatus: string | null;
  submissionId: string | null;
};

function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline hover:text-brand-dark"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

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
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex flex-col gap-3 rounded-2xl border border-border-soft bg-white p-5">
        <div className="h-6 w-3/4 rounded bg-stone-200" />
        <div className="h-4 w-1/2 rounded bg-stone-200" />
        <div className="h-9 w-28 rounded-lg bg-stone-200 mt-2" />
      </div>
      <div className="h-36 rounded-2xl border border-border-soft bg-white p-5" />
      <div className="h-28 rounded-2xl border border-border-soft bg-white p-5" />
    </div>
  );
}

export function MobileApplyDetail() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");
  const [application, setApplication] =
    useState<ApplicationDetailResponse | null>(null);
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

  const appData = application?.application;
  const alreadySubmitted = Boolean(application?.submissionStatus);

  // Status checks for open / closed / upcoming dates
  const now = new Date();
  const isUpcoming = Boolean(
    appData?.openAt && new Date(appData.openAt) > now
  );
  const isExpired = Boolean(
    appData?.closeAt && new Date(appData.closeAt) < now
  );

  const submissionId = application?.submissionId ?? null;
  const rawRoles = appData?.roles ?? [];
  const normalizedRoles: Role[] = rawRoles.map((role) =>
    typeof role === "string" ? { title: role } : role
  );

  return (
    <MobileScreen>
      {/* Back Link */}
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 style-caption text-brand hover:underline w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Applications
      </Link>

      {loading ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-white p-5 style-mobile-body text-ink-muted">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      ) : application && appData ? (
        <>
          {/* Header Card */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h1 className="style-mobile-title text-ink font-bold leading-tight">
                  {appData.title}
                </h1>
                {getStatusBadge(
                  application.draft,
                  application.submissionStatus
                )}
              </div>

              <div className="flex items-center gap-1.5 style-mobile-body text-ink-muted text-xs">
                <Calendar className="h-3.5 w-3.5 text-ink-faint shrink-0" />
                <span>
                  Decision Date: {formatDate(appData.decisionDate, "TBD")}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-1">
              {alreadySubmitted ? (
                <Button
                  href={
                    submissionId
                      ? `/applications/submitted?submissionId=${submissionId}`
                      : `/applications/submitted?submissionId=${appData.id}`
                  }
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                >
                  View Application
                </Button>
              ) : isUpcoming ? (
                <Button
                  disabled
                  size="sm"
                  className="w-full justify-center cursor-not-allowed opacity-60 bg-stone-300 text-stone-600 border-stone-300 hover:bg-stone-300"
                >
                  Applications Open {formatDate(appData.openAt!, "")}
                </Button>
              ) : isExpired ? (
                <div className="w-full text-center rounded-xl border border-border-soft bg-stone-100 py-2 style-caption text-ink-muted font-semibold">
                  Application Closed
                </div>
              ) : (
                <Button
                  href={`/applications/form?id=${appData.id}`}
                  size="sm"
                  className="w-full justify-center shadow-sm"
                >
                  Apply Now
                </Button>
              )}
            </div>
          </div>

          {/* Status Alerts */}
          {alreadySubmitted && (
            <div className="flex items-start gap-2.5 rounded-xl border border-brand-soft bg-brand-soft/30 p-4 style-mobile-body text-brand-dark text-xs">
              <CheckCircle className="h-4 w-4 text-brand shrink-0 mt-0.5" />
              <span>You have already submitted an application for this program.</span>
            </div>
          )}

          {isUpcoming && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 style-mobile-body text-amber-900 text-xs">
              <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Applications will open on{" "}
                <strong className="font-semibold">
                  {formatDate(appData.openAt!, "")}
                </strong>
                .
              </span>
            </div>
          )}

          {isExpired && !alreadySubmitted && (
            <div className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-100 p-4 style-mobile-body text-ink-muted text-xs">
              <Info className="h-4 w-4 text-ink-faint shrink-0 mt-0.5" />
              <span>
                Applications for this program closed on{" "}
                {formatDate(appData.closeAt, "")}.
              </span>
            </div>
          )}

          {/* Description & Eligibility Section */}
          <div className="flex flex-col gap-5 rounded-2xl border border-border-soft bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <h2 className="style-section-header text-base text-ink font-semibold">
                Description
              </h2>
              <p className="whitespace-pre-wrap style-mobile-body leading-relaxed text-ink-muted text-sm">
                {renderTextWithLinks(appData.description)}
              </p>
            </div>

            {Array.isArray(appData.eligibility) &&
            appData.eligibility.length > 0 ? (
              <div className="flex flex-col gap-2 pt-3 border-t border-border-soft">
                <h2 className="style-section-header text-base text-ink font-semibold">
                  Eligibility Requirements
                </h2>
                <ul className="flex flex-col gap-1.5 style-mobile-body text-ink-muted text-sm pl-0.5">
                  {appData.eligibility.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                      <span className="leading-relaxed whitespace-pre-wrap">{renderTextWithLinks(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {Array.isArray(appData.link) &&
            appData.link.length > 0 ? (
              <div className="flex flex-col gap-1 pt-2 border-t border-border-soft">
                <h2 className="style-section-header text-ink pb-2">
                  Reference Links for Application
                </h2>
                <FormattedLinks links={appData.link} />
                </div>
            ) : null}
          </div>

          {/* Roles Section */}
          {normalizedRoles.length > 0 ? (
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex items-center gap-3">
                <h2 className="style-section-header text-base text-ink shrink-0 font-semibold">
                  Available Roles
                </h2>
                <span className="h-px flex-1 bg-border-soft" />
              </div>

              <div className="flex flex-col gap-3">
                {normalizedRoles.map((role, idx) => (
                  <RoleCard key={role.title || idx} {...role} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <BottomNav />
    </MobileScreen>
  );
}