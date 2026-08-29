"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { RoleCard } from "@/components/apply/role-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileApplyDetail } from "@/components/mobile/apply/MobileApplyDetail";
// import { applyDetailRoles } from "@/lib/data";

type ApplicationDetailResponse = {
  application: {
    id: string;
    title: string;
    description: string;
    decisionDate: string | null;
    phase: "open" | "upcoming" | "closed";
    programType: string;
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
  submissionStatus: string | null,
) {
  if (submissionStatus) {
    const label = submissionStatus
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    if (submissionStatus === "ACCEPTED") {
      return <Badge label={label} bg="#d3eccf" color="#356b2e" />;
    }

    if (submissionStatus === "REJECTED") {
      return <Badge label={label} bg="#f9d5d3" color="#9a3b36" />;
    }

    if (submissionStatus === "WAITLISTED") {
      return <Badge label={label} bg="#fbe3cb" color="#7a4416" />;
    }

    if (submissionStatus === "IN_REVIEW") {
      return <Badge label={label} bg="#e1e8ff" color="#1f3aa3" />;
    }

    if (submissionStatus === "IN_CONSIDERATION") {
      return <Badge label={label} bg="#e9e5f6" color="#4b4178" />;
    }

    if (submissionStatus === "COMPLETED" || submissionStatus === "ARCHIVED") {
      return <Badge label={label} bg="#efece3" color="#6a685f" />;
    }

    return <Badge label={label} bg="#e1e8ff" color="#1f3aa3" />;
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

function getProgramRoles(programType: string) {
  switch (programType) {
    case "AI_ACADEMY":
      return [
        {
          title: "Foundations Track",
          description:
            "Learn the core concepts that power AI and machine learning projects, with an emphasis on guided practice.",
          tagRows: [
            [
              { label: "Beginner friendly", bg: "#e1e8ff", color: "#1f3aa3" },
              {
                label: "10 weeks",
                bg: "#efece3",
                color: "#6a685f",
                border: "#e2ded2",
              },
            ],
          ],
        },
        {
          title: "Project Track",
          description:
            "Apply what you learn in a hands-on project environment and build something you can show off.",
          tagRows: [
            [
              { label: "Project based", bg: "#e9e5f6", color: "#4b4178" },
              { label: "Team support", bg: "#d3eccf", color: "#356b2e" },
            ],
          ],
        },
      ];
    case "AI_INNOVATION":
      return [
        {
          title: "Build Track",
          description:
            "Work on practical AI ideas and ship useful products with a collaborative team.",
          tagRows: [
            [
              { label: "Collaborative", bg: "#d6e2ff", color: "#284b9c" },
              { label: "Hands on", bg: "#cde9e5", color: "#1d6a61" },
            ],
          ],
        },
        {
          title: "Launch Track",
          description:
            "Focus on turning project ideas into polished demos, prototypes, and presentations.",
          tagRows: [
            [
              { label: "Prototype", bg: "#fbe3cb", color: "#7a4416" },
              {
                label: "Demo ready",
                bg: "#efece3",
                color: "#6a685f",
                border: "#e2ded2",
              },
            ],
          ],
        },
      ];
    case "AI_MENTORSHIP_MENTOR":
      return [
        {
          title: "Mentor Track",
          description:
            "Guide newer members, share your experience, and help projects move forward with confidence.",
          tagRows: [
            [
              { label: "Leadership", bg: "#e1e8ff", color: "#1f3aa3" },
              { label: "Community", bg: "#d3eccf", color: "#356b2e" },
            ],
          ],
        },
        {
          title: "Support Track",
          description:
            "Focus on availability, communication, and consistent support throughout the program.",
          tagRows: [
            [
              { label: "Mentoring", bg: "#e9e5f6", color: "#4b4178" },
              {
                label: "Weekly check-ins",
                bg: "#efece3",
                color: "#6a685f",
                border: "#e2ded2",
              },
            ],
          ],
        },
      ];
    case "AI_MENTORSHIP_MENTEE":
    default:
      return [
        {
          title: "Growth Track",
          description:
            "Receive guidance while building your skills, confidence, and project experience.",
          tagRows: [
            [
              { label: "Guided", bg: "#d3eccf", color: "#356b2e" },
              { label: "Skill building", bg: "#e1e8ff", color: "#1f3aa3" },
            ],
          ],
        },
        {
          title: "Consistency Track",
          description:
            "Stay engaged with the program and make steady progress week by week.",
          tagRows: [
            [
              { label: "Commitment", bg: "#fbe3cb", color: "#7a4416" },
              { label: "Project based", bg: "#e9e5f6", color: "#4b4178" },
            ],
          ],
        },
      ];
  }
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="h-[14px] w-[150px] rounded-full bg-[#efece3]" />
      <div className="flex flex-col gap-[16px] rounded-[16px] border border-border-soft bg-white p-[29px]">
        <div className="h-[32px] w-[420px] max-w-full rounded-full bg-[#f4f1ea]" />
        <div className="h-[18px] w-[220px] rounded-full bg-[#f4f1ea]" />
        <div className="h-[18px] w-[520px] max-w-full rounded-full bg-[#f4f1ea]" />
        <div className="h-[18px] w-[360px] max-w-full rounded-full bg-[#f4f1ea]" />
      </div>
      <div className="flex items-center gap-[12px] pt-[6px]">
        <div className="h-[26px] w-[74px] rounded-full bg-[#f4f1ea]" />
        <span className="h-[1.5px] min-w-px flex-1 bg-border-soft" />
      </div>
      <div className="flex flex-col gap-[14px]">
        <div className="h-[128px] rounded-[16px] border border-border-soft bg-white" />
        <div className="h-[128px] rounded-[16px] border border-border-soft bg-white" />
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
  const programRoles = application
    ? getProgramRoles(application.application.programType)
    : [];
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
    <>
      <div className="md:hidden">
        <MobileApplyDetail />
      </div>

      <div className="hidden md:block">
    <div className="flex min-h-screen w-full flex-col bg-cream">
      <Navbar active="Apply" />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[20px] px-[46px] pb-[46px] pt-[45px]">
        {/* TODO: Convert this route to /applications/detail/[id] once the page becomes dynamic. */}
        <Link
          href="/applications"
          className="style-caption leading-[16.8px] tracking-[0.2px] text-brand"
        >
          ← Back to Apply
        </Link>

        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          <div className="rounded-[16px] border border-border-soft bg-white p-[29px] style-body-text leading-[21.75px] text-ink-muted">
            {error}
          </div>
        ) : application ? (
          <>
            <div className="flex flex-col gap-[16px] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-[8px]">
                <h1 className="style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                  {application.application.title}
                </h1>
                <p className="style-body-text leading-[21.75px] text-ink-muted">
                  {formatDecisionDate(application.application.decisionDate)}
                </p>
              </div>
              <div className="flex flex-col items-start gap-[10px] sm:items-end">
                {getStatusBadge(
                  application.draft,
                  application.submissionStatus,
                )}
                {alreadySubmitted ? (
                  <div className="rounded-full border border-border-soft bg-[#efece3] px-[18px] py-[11px]  font-semibold leading-none text-ink-muted">
                    Already submitted
                  </div>
                ) : (
                  <Button
                    href={`/applications/form?id=${application.application.id}`}
                    size="lg"
                    className="shrink-0 self-start sm:self-auto"
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>

            {alreadySubmitted ? (
              <div className="rounded-[16px] border border-border-soft bg-[#fbfaf7] px-[20px] py-[16px] style-body-text leading-[20.3px] text-ink-muted">
                You have already submitted an application for this program.
              </div>
            ) : null}

            <div className="rounded-[16px] border border-border-soft bg-white p-[29px]">
              <div className="flex flex-col gap-[20px]">
                <div className="flex flex-col gap-[8px]">
                  <h2 className="style-section-header leading-[23.56px] text-ink [font-variation-settings:'wdth'_100]">
                    Description
                  </h2>
                  <p className="style-body-text leading-[20.3px] text-ink-muted">
                    {application.application.description}
                  </p>
                </div>

                {Array.isArray(application.application.eligibility) && application.application.eligibility.length > 0 ? (
                  <div className="flex flex-col gap-[8px]">
                    <h2 className="style-section-header leading-[23.56px] text-ink [font-variation-settings:'wdth'_100]">
                      Eligibility
                    </h2>
                    <ul className="flex list-disc flex-col gap-[8px] pl-[18px] style-body-text leading-[20.3px] text-ink-muted">
                      {application.application.eligibility.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-[12px] pt-[6px]">
              <h2 className="style-section-header leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]">
                Roles
              </h2>
              <span className="h-[1.5px] min-w-px flex-1 bg-border-soft" />
            </div>

            {programRoles.map((role) => (
              <RoleCard key={role.title} {...role} />
            ))}
          </>
        ) : null}
      </div>
    </div>
      </div>
    </>
  );
}

function DetailPageFallback() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-cream">
      <Navbar active="Apply" />
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[20px] px-[46px] pb-[46px] pt-[45px]">
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
