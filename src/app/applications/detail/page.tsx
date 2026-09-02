"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { RoleCard } from "@/components/apply/role-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileApplyDetail } from "@/components/mobile/apply/MobileApplyDetail";
import { ArrowLeft, Calendar, Info, Clock, CheckCircle, AlertCircle } from "lucide-react";

type RoleItem =
  | string
  | {
      title: string;
      description?: string;
      tagRows?: Array<
        Array<{
          label: string;
          bg?: string;
          color?: string;
          border?: string;
        }>
      >;
    };

type ApplicationDetailResponse = {
  application: {
    id: string;
    title: string;
    description: string;
    decisionDate: string | null;
    openAt?: string | null;
    closeAt?: string | null;
    phase: "open" | "upcoming" | "closed";
    programType: string;
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
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-4 w-32 rounded bg-stone-200" />
      <div className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-white p-8">
        <div className="h-8 w-2/3 rounded-md bg-stone-200" />
        <div className="h-4 w-1/3 rounded-md bg-stone-200" />
        <div className="h-16 w-full rounded-md bg-stone-100" />
      </div>
      <div className="h-6 w-24 rounded bg-stone-200 mt-4" />
      <div className="flex flex-col gap-4">
        <div className="h-32 rounded-2xl border border-border-soft bg-white" />
        <div className="h-32 rounded-2xl border border-border-soft bg-white" />
      </div>
    </div>
  );
}

function ApplyDetailContent() {
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

  const submissionId = application?.submissionId;

  // Normalize dynamic roles whether returned as string array or role object array
  const rawRoles = appData?.roles ?? [];
  const normalizedRoles = rawRoles.map((role) =>
    typeof role === "string" ? { title: role } : role
  );

  return (
    <>
      <div className="md:hidden">
        <MobileApplyDetail />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar active="Apply" />

          <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
            {/* Navigation back link */}
            <Link
              href="/applications"
              className="inline-flex items-center gap-2 style-caption text-brand hover:underline transition-all w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Applications
            </Link>

            {loading ? (
              <DetailSkeleton />
            ) : error ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-white p-6 style-body-text text-ink-muted shadow-sm">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            ) : application && appData ? (
              <>
                {/* Header Card */}
                <div className="flex flex-col gap-6 rounded-2xl border border-border-soft bg-white p-8 shadow-sm sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-3 max-w-2xl">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="style-section-header text-3xl text-ink tracking-tight font-bold">
                        {appData.title}
                      </h1>
                      {getStatusBadge(
                        application.draft,
                        application.submissionStatus
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 style-body-text text-ink-muted text-sm">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-ink-faint" />
                        Decision Date:{" "}
                        {formatDate(appData.decisionDate, "TBD")}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Primary CTA Action */}
                  <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                    {alreadySubmitted ? (
                      <Button
                        href={
                          submissionId
                            ? `/applications/submitted?submissionId=${submissionId}`
                            : `/applications/submitted?submissionId=${appData.id}`
                        }
                        variant="ghost"
                        size="lg"
                        className="shrink-0"
                      >
                        View Application
                      </Button>
                    ) : isUpcoming ? (
                      <Button
                        disabled
                        size="lg"
                        className="shrink-0 cursor-not-allowed opacity-60 bg-stone-300 text-stone-600 border-stone-300 hover:bg-stone-300"
                      >
                        Applications Open {formatDate(appData.openAt!, "")}
                      </Button>
                    ) : isExpired ? (
                      <div className="rounded-xl border border-border-soft bg-stone-100 px-5 py-2.5 style-caption text-ink-muted font-semibold">
                        Application Closed
                      </div>
                    ) : (
                      <Button
                        href={`/applications/form?id=${appData.id}`}
                        size="lg"
                        className="shrink-0 shadow-sm"
                      >
                        Apply Now
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status Notice Alerts */}
                {alreadySubmitted && (
                  <div className="flex items-center gap-3 rounded-xl border border-brand-soft bg-brand-soft/30 px-5 py-4 style-body-text text-brand-dark">
                    <CheckCircle className="h-5 w-5 text-brand shrink-0" />
                    <span>
                      You have already submitted an application for this program.
                    </span>
                  </div>
                )}

                {isUpcoming && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-4 style-body-text text-amber-900">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                    <span>
                      Applications for this program will open on{" "}
                      <strong className="font-semibold">
                        {formatDate(appData.openAt!, "")}
                      </strong>
                      . Please check back then.
                    </span>
                  </div>
                )}

                {isExpired && !alreadySubmitted && (
                  <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-100 px-5 py-4 style-body-text text-ink-muted">
                    <Info className="h-5 w-5 text-ink-faint shrink-0" />
                    <span>
                      Applications for this program closed on{" "}
                      {formatDate(appData.closeAt!, "")}.
                    </span>
                  </div>
                )}

                {/* Description & Eligibility Section */}
                <div className="rounded-2xl border border-border-soft bg-white p-8 shadow-sm">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h2 className="style-section-header text-xl text-ink">
                        Description
                      </h2>
                      <p className="style-body-text leading-relaxed text-ink-muted">
                        {appData.description}
                      </p>
                    </div>

                    {Array.isArray(appData.eligibility) &&
                    appData.eligibility.length > 0 ? (
                      <div className="flex flex-col gap-3 pt-4 border-t border-border-soft">
                        <h2 className="style-section-header text-xl text-ink">
                          Eligibility Requirements
                        </h2>
                        <ul className="flex flex-col gap-2 style-body-text text-ink-muted pl-1">
                          {appData.eligibility.map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand mt-2 shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Open Roles Section */}
                {normalizedRoles.length > 0 ? (
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center gap-4">
                      <h2 className="style-section-header text-xl text-ink shrink-0">
                        Available Roles
                      </h2>
                      <span className="h-px flex-1 bg-border-soft" />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {normalizedRoles.map((role, idx) => (
                        <RoleCard key={role.title || idx} {...role} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </main>
        </div>
      </div>
    </>
  );
}

function DetailPageFallback() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-cream">
      <Navbar active="Apply" />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
        <DetailSkeleton />
      </div>
    </div>
  );
}

export default function ApplyDetailPage() {
  return (
    <Suspense fallback={<DetailPageFallback />}>
      <ApplyDetailContent />
    </Suspense>
  );
}