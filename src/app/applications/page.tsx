"use client";

import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { SectionHeader } from "@/components/ui/section-header";
import { StepCard } from "@/components/apply/step-card";
import { ProgramCard } from "@/components/apply/program-card";
import { Marquee } from "@/components/apply/marquee";
import { OpenAppRow, type OpenApp } from "@/components/apply/open-app-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileApply } from "@/components/mobile/apply/MobileApply";
import { applySteps, programs } from "@/lib/data";

type ApplicationResponse = {
  applications: Array<{
    id: string;
    title: string;
    description: string;
    openAt: string;
    closeAt: string;
    phase: "open" | "upcoming" | "closed";
    draft: {
      stepIndex: number;
      isSubmitted: boolean;
    } | null;
    submissionStatus: string | null;
    submissionId: string | null;
    submittedAt: string | null;
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

function getStatusBadge(
  draft: ApplicationResponse["applications"][number]["draft"],
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

function buildOpenRow(
  application: ApplicationResponse["applications"][number],
): OpenApp {
  const borderColor = application.phase === "open" ? "#2f5fe8" : "#e7e2d4";
  const meta =
    application.phase === "upcoming"
      ? `opens ${formatDateTime(application.openAt)}`
      : application.phase === "closed"
        ? `closed ${formatDateTime(application.closeAt)}`
        : `closes ${formatDateTime(application.closeAt)}`;

  const actions =
    application.phase === "open"
      ? [
          {
            label: "Learn more",
            variant: "soft" as const,
            href: `/applications/detail?id=${application.id}`,
          },
          {
            label: "Apply",
            variant: "primary" as const,
            href: `/applications/form?id=${application.id}`,
          },
        ]
      : application.phase === "upcoming"
        ? [
            {
              label: "Learn more",
              variant: "ghost" as const,
              href: `/applications/detail?id=${application.id}`,
            },
            { label: "Remind me", variant: "accent" as const, pill: false },
          ]
        : [
            {
              label: "Learn more",
              variant: "ghost" as const,
              href: `/applications/detail?id=${application.id}`,
            },
          ];

  return {
    title: application.title,
    description: application.description,
    meta,
    borderColor,
    closeAt: application.closeAt,
    metaMedium: application.phase !== "upcoming",
    dim: application.phase !== "open",
    statusBadge: getStatusBadge(
      application.draft,
      application.submissionStatus,
    ),
    actions,
  };
}

function buildSubmittedRow(
  application: ApplicationResponse["applications"][number],
): OpenApp {
  const statusBadge = application.submissionStatus ? (
    getStatusBadge(application.draft, application.submissionStatus)
  ) : (
    <Badge label="Submitted" variant="outline" />
  );

  return {
    title: application.title,
    description: application.description,
    meta: application.submittedAt
      ? `submitted ${formatDateTime(application.submittedAt)}`
      : "submitted",
    borderColor: "#d9d3c7",
    metaMedium: true,
    statusBadge,
    actions: [
      {
        label: "Submitted",
        variant: "outline" as const,
        disabled: true,
      },
      {
        label: "View application",
        variant: "primary" as const,
        href: application.submissionId
          ? `/applications/submitted?submissionId=${application.submissionId}`
          : "/applications/history",
      },
    ],
  };
}

function ApplicationSkeleton() {
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-2xl border border-border-soft bg-white/80 p-6 
      sm:flex-row sm:items-center sm:justify-between sm:gap-6 shadow-xs">
      <div className="min-w-0 flex-1 animate-pulse space-y-2.5">
        <div className="h-5 w-64 rounded-full bg-stone-soft" />
        <div className="h-3.5 w-full max-w-lg rounded-full bg-[#f4f1ea]" />
        <div className="h-3 w-48 rounded-full bg-[#f4f1ea]" />
      </div>
      <div className="flex shrink-0 gap-2.5">
        <div className="h-9 w-24 rounded-lg bg-[#f4f1ea] animate-pulse" />
        <div className="h-9 w-20 rounded-lg bg-[#f4f1ea] animate-pulse" />
      </div>
    </div>
  );
}

function ApplicationEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border-soft/80 bg-white/60 px-6 py-6 style-body-text leading-relaxed text-ink-muted transition-colors">
      {message}
    </div>
  );
}

function ApplicationSection({
  title,
  items,
  loading,
  emptyMessage,
  action,
  buildRow,
  collapsible = false,
  initialLimit = 2,
}: {
  title: string;
  items: ApplicationResponse["applications"];
  loading: boolean;
  emptyMessage: string;
  action?: ReactNode;
  buildRow: (
    application: ApplicationResponse["applications"][number],
  ) => OpenApp;
  collapsible?: boolean;
  initialLimit?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldCollapse = collapsible && items.length > initialLimit;
  const displayedItems = shouldCollapse && !isExpanded ? items.slice(0, initialLimit) : items;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-8 flex flex-col gap-4 px-8 lg:px-12"
    >
      <SectionHeader title={title} action={action} />
      {loading ? (
        <div className="flex flex-col gap-3.5">
          <ApplicationSkeleton />
          <ApplicationSkeleton />
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-3.5 relative">
          {displayedItems.map((application, idx) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06, ease: "easeOut" }}
            >
              <OpenAppRow {...buildRow(application)} />
            </motion.div>
          ))}

          {shouldCollapse && (
            <div className="mt-2 flex justify-center">
              <Button
                variant="soft"
                size="sm"
                pill
                onClick={() => setIsExpanded(!isExpanded)}
                type="button"
                className="gap-1.5 shadow-2xs transition-all duration-200 hover:shadow-xs"
              >
                {isExpanded ? (
                  <>Show less ↑</>
                ) : (
                  <>View more ({items.length - initialLimit} more) ↓</>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <ApplicationEmptyState message={emptyMessage} />
      )}
    </motion.section>
  );
}

function sortApplications(
  items: ApplicationResponse["applications"],
  phase: "open" | "upcoming" | "closed",
) {
  return items
    .filter((item) => item.phase === phase && !item.submissionId)
    .slice()
    .sort((left, right) => {
      const leftDate =
        phase === "upcoming"
          ? new Date(left.openAt).getTime()
          : new Date(left.closeAt).getTime();
      const rightDate =
        phase === "upcoming"
          ? new Date(right.openAt).getTime()
          : new Date(right.closeAt).getTime();

      if (phase === "closed") {
        return rightDate - leftDate;
      }

      return leftDate - rightDate;
    });
}

function sortSubmittedApplications(items: ApplicationResponse["applications"]) {
  return items
    .filter((item) => item.submissionId)
    .slice()
    .sort((left, right) => {
      const leftDate = left.submittedAt
        ? new Date(left.submittedAt).getTime()
        : 0;
      const rightDate = right.submittedAt
        ? new Date(right.submittedAt).getTime()
        : 0;

      return rightDate - leftDate;
    });
}

function ProgramFlowArrow() {
  return (
    <div
      className="flex shrink-0 items-center justify-center text-brand"
      aria-hidden="true"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-[#fbfaf7] text-lg font-medium shadow-xs transition-transform hover:scale-105 lg:hidden">
        ↓
      </span>
      <span className="hidden h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-[#fbfaf7] text-xl font-medium shadow-xs transition-transform hover:scale-105 lg:flex">
        →
      </span>
    </div>
  );
}

/**
 * This page intentionally uses the same live application list on every
 * breakpoint. It is backed by /api/applications, so applications created by
 * administrators appear here as soon as they are visible to users.
 */
export default function ApplyPage() {
  const [applications, setApplications] = useState<
    ApplicationResponse["applications"]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      setLoading(true);

      try {
        const response = await fetch("/api/applications", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load applications: ${response.status}`);
        }

        const payload = (await response.json()) as ApplicationResponse;
        setApplications(
          Array.isArray(payload.applications) ? payload.applications : [],
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setApplications([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      controller.abort();
    };
  }, []);

  const openApplications = sortApplications(applications, "open");
  const upcomingApplications = sortApplications(applications, "upcoming");
  const closedApplications = sortApplications(applications, "closed");
  const submittedApplications = sortSubmittedApplications(applications);

  return (
    <>
      {/* --- MOBILE LAYOUT --- */}
      <div className="md:hidden">
        <MobileApply />
      </div>

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:block">
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-cream antialiased">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-[15%] -z-10 h-[420px] w-[420px] rounded-full bg-orange-300/25 blur-[110px]" />
          <div aria-hidden className="pointer-events-none absolute top-[20%] right-[10%] -z-10 h-[380px] w-[380px] rounded-full bg-purple-400/20 blur-[110px]" />

          <Navbar active="Apply" />

          <main className="relative w-full pb-16 pt-8">
            {/* Header Hero Section */}
            <section className="px-8 lg:px-12 pt-4">
              <h1 className="font-display style-page-title text-4xl lg:text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-ink [font-variation-settings:'wdth'_100]">
                Choose Your <span className="bg-[linear-gradient(90deg,#f2a968_0%,#7d64c4_100%)] bg-clip-text text-transparent">AIS Path</span>
              </h1>
              <p className="mt-3 max-w-4xl style-page-subtitle lg: font-normal leading-relaxed text-ink/80">
                Welcome to the enrollment hub. Whether you&apos;re here to learn,
                lead, or build, there&apos;s a place waiting for you.
              </p>
            </section>

            {/* How to Begin Steps */}
            {/* <section className="mt-12 flex flex-col gap-4 px-8 lg:px-12">
              <SectionHeader
                title="How to Begin"
                titleClassName=" lg: leading-tight font-semibold"
              />
              <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
                {applySteps.map((step) => (
                  <StepCard key={step.step} {...step} />
                ))}
              </div>
            </section> */}

            {/* Program Workflow */}
            <section className="mt-10 px-8 lg:px-12">
              {/* <SectionHeader title="Our Pipeline" titleClassName=" pb-6" /> */}
              <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch pt-2">
                {programs.map((program, index) => (
                  <Fragment key={program.title}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.15, ease: "easeOut" }}
                      className="flex-1 flex flex-col h-full"
                    >
                      <ProgramCard {...program} showActionButton={false} />
                    </motion.div>
                    {index < programs.length - 1 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: index * 0.15 + 0.1 }}
                        className="self-center"
                      >
                        <ProgramFlowArrow />
                      </motion.div>
                    ) : null}
                  </Fragment>
                ))}
              </div>
            </section>

            {/* Marquee Divider */}
            <div className="overflow-visible mt-10">
              <Marquee text="JOIN THE MOVEMENT · AIS UTD · BUILD THE FUTURE" />
            </div>

            {/* Application List Sections */}
            <div className="space-y-4">
              <ApplicationSection
                title="Open Applications"
                items={openApplications}
                loading={loading}
                emptyMessage="There are no open applications right now."
                buildRow={buildOpenRow}
                collapsible={true}
                initialLimit={2}
              />
              <ApplicationSection
                title="Upcoming Applications"
                items={upcomingApplications}
                loading={loading}
                emptyMessage="There are no upcoming applications."
                buildRow={buildOpenRow}
                collapsible={true}
                initialLimit={2}
              />
              <ApplicationSection
                title="Submitted Applications"
                items={submittedApplications}
                loading={loading}
                emptyMessage="You have not submitted any applications yet."
                action={
                  <Button href="/applications/history" variant="ghost" size="sm">
                    View history
                  </Button>
                }
                buildRow={buildSubmittedRow}
                collapsible={true}
                initialLimit={2}
              />
              <ApplicationSection
                title="Closed Applications"
                items={closedApplications}
                loading={loading}
                emptyMessage="There are no closed applications to show."
                buildRow={buildOpenRow}
                collapsible={true}
                initialLimit={2}
              />
            </div>
          </main>
        </div>
      </div>
    </>
    /*
    <>
      {/* --- TEMPORARY OPENING SOON MOBILE LAYOUT --- * /}
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-cream antialiased md:hidden">
        <div aria-hidden className="pointer-events-none absolute -top-16 left-[10%] -z-10 h-[300px] w-[300px] rounded-full bg-orange-300/25 blur-[100px]" />
        <div aria-hidden className="pointer-events-none absolute top-[30%] right-[-10%] -z-10 h-[260px] w-[260px] rounded-full bg-purple-400/20 blur-[100px]" />
        <BottomNav/>
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white/80 p-8 shadow-sm backdrop-blur-xs">
            <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
              Applications
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">
              Opening Soon
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              This page will open up at Kickoff on September 3, at 7pm.
            </p>
          </div>
        </main>
      </div>

      {/* --- TEMPORARY OPENING SOON DESKTOP LAYOUT --- * /}
      <div className="hidden md:block">
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-cream antialiased">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-[15%] -z-10 h-[420px] w-[420px] rounded-full bg-orange-300/25 blur-[110px]" />
          <div aria-hidden className="pointer-events-none absolute top-[20%] right-[10%] -z-10 h-[380px] w-[380px] rounded-full bg-purple-400/20 blur-[110px]" />

          <Navbar active="Apply" />

          <main className="relative flex flex-1 w-full flex-col items-center justify-center pb-16 pt-8">
            <section className="w-full max-w-2xl px-8 text-center lg:px-12">
              <div className="rounded-2xl border border-border-soft bg-white/80 p-12 shadow-sm backdrop-blur-xs">
                <span className="inline-block rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                  Applications
                </span>
                <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink lg:text-5xl">
                  Opening Soon
                </h1>
                <p className="mt-4 text-base leading-relaxed text-ink-muted lg:text-lg">
                  This page will open up at Kickoff on September 3, at 7pm.
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
    */
  );
}
