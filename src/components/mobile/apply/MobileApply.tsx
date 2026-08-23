"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { applySteps, programs } from "@/lib/data";

type ApplicationResponse = {
  applications: Array<{
    id: string;
    title: string;
    description: string;
    openAt: string;
    closeAt: string;
    phase: "open" | "upcoming" | "closed";
    draft: { stepIndex: number; isSubmitted: boolean } | null;
    submissionStatus: string | null;
    submissionId?: string | null;
    submittedAt?: string | null;
  }>;
};

type OpenAppRow = {
  id: string;
  title: string;
  description: string;
  meta: string;
  borderColor: string;
  dim: boolean;
  statusBadge: React.ReactNode;
  actions: Array<{
    label: string;
    variant: "primary" | "accent" | "soft" | "ghost" | "outline";
    pill?: boolean;
    href?: string;
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

function buildRow(application: ApplicationResponse["applications"][number]): OpenAppRow {
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
          { label: "Learn more", variant: "soft" as const, href: `/applications/detail?id=${application.id}` },
          { label: "Apply", variant: "primary" as const, href: `/applications/form?id=${application.id}` },
        ]
      : application.phase === "upcoming"
        ? [
            { label: "Learn more", variant: "ghost" as const },
            { label: "Remind me", variant: "accent" as const, pill: false },
          ]
        : [
            { label: "Learn more", variant: "ghost" as const },
            { label: "View details", variant: "soft" as const, href: `/applications/detail?id=${application.id}` },
          ];

  return {
    id: application.id,
    title: application.title,
    description: application.description,
    meta,
    borderColor,
    dim: application.phase !== "open",
    statusBadge: getStatusBadge(application.draft, application.submissionStatus),
    actions,
  };
}

function buildSubmittedRow(application: ApplicationResponse["applications"][number]): OpenAppRow {
  const statusBadge = application.submissionStatus ? (
    getStatusBadge(application.draft, application.submissionStatus)
  ) : (
    <Badge label="Submitted" variant="outline" />
  );

  return {
    id: application.id,
    title: application.title,
    description: application.description,
    meta: application.submittedAt
      ? `submitted ${formatDateTime(application.submittedAt)}`
      : "submitted",
    borderColor: "#d9d3c7",
    dim: false,
    statusBadge,
    actions: [
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
    <div className="flex flex-col gap-[10px] rounded-[14px] border border-border-soft bg-white p-[16px]">
      <div className="h-[16px] w-[70%] animate-pulse rounded-full bg-[#efece3]" />
      <div className="h-[12px] w-[90%] animate-pulse rounded-full bg-[#f4f1ea]" />
      <div className="flex gap-[8px]">
        <div className="h-[34px] flex-1 animate-pulse rounded-[8px] bg-[#f4f1ea]" />
        <div className="h-[34px] flex-1 animate-pulse rounded-[8px] bg-[#f4f1ea]" />
      </div>
    </div>
  );
}

function ApplicationSection({
  title,
  items,
  loading,
  emptyMessage,
  buildRowFn = buildRow,
}: {
  title: string;
  items: ApplicationResponse["applications"];
  loading: boolean;
  emptyMessage: string;
  buildRowFn?: (app: ApplicationResponse["applications"][number]) => OpenAppRow;
}) {
  return (
    <div className="flex flex-col gap-[12px]">
      <h2 className="font-sans  font-bold text-ink">{title}</h2>
      {loading ? (
        <div className="flex flex-col gap-[12px]">
          <ApplicationSkeleton />
        </div>
      ) : items.length > 0 ? (
        items.map((application) => {
          const app = buildRowFn(application);
          return (
            <div
              key={app.id}
              className="flex flex-col gap-[12px] rounded-[14px] border bg-white p-[16px]"
              style={{ borderColor: app.borderColor, opacity: app.dim ? 0.94 : 1 }}
            >
              <div className="flex items-start justify-between gap-[8px]">
                <div>
                  <h3 className="font-sans  font-bold text-ink">
                    {app.title}
                  </h3>
                  <p className="mt-[4px] font-sans  font-normal text-ink-muted">
                    {app.description}
                  </p>
                  <p className="mt-[4px] font-sans  font-normal text-ink-faint">
                    {app.meta}
                  </p>
                </div>
                {app.statusBadge}
              </div>
              <div className="flex gap-[8px]">
                {app.actions.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    size="sm"
                    pill={action.pill}
                    href={action.href}
                    className="flex-1"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="rounded-[14px] border border-border-soft bg-white p-[16px] style-body-text  text-ink-muted">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export function MobileApply() {
  const [applications, setApplications] = useState<ApplicationResponse["applications"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      setLoading(true);

      try {
        const response = await fetch("/api/applications", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load applications: ${response.status}`);
        }
        const payload = (await response.json()) as ApplicationResponse;
        setApplications(Array.isArray(payload.applications) ? payload.applications : []);
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
    return () => controller.abort();
  }, []);

  const openApplications = applications.filter(
    (a) => a.phase === "open" && !a.submissionStatus && !a.draft?.isSubmitted
  );
  const upcomingApplications = applications.filter(
    (a) => a.phase === "upcoming" && !a.submissionStatus && !a.draft?.isSubmitted
  );
  const closedApplications = applications.filter(
    (a) => a.phase === "closed" && !a.submissionStatus && !a.draft?.isSubmitted
  );
  const submittedApplications = applications.filter(
    (a) => a.submissionStatus || a.draft?.isSubmitted
  );

  return (
    <MobileScreen>
      <div className="flex flex-col gap-2 pt-4">
        <h1 className="style-page-title  leading-tight text-ink">
          Choose Your <span className="text-brand">AIS Path</span>
        </h1>
        <p className="style-page-subtitle  text-ink-muted">
          Welcome to the enrollment hub. Whether you&apos;re here to learn,
          lead, or build, there&apos;s a place waiting for you.
        </p>
      </div>

      {/* How to Begin
      <div className="flex flex-col gap-[12px]">
        <h2 className="font-sans  font-bold text-ink">
          How to Begin
        </h2>
        {applySteps.map((step) => (
          <div
            key={step.step}
            className="relative flex flex-col gap-[4px] overflow-hidden rounded-[16px] border border-brand bg-white px-[18px] py-[16px]"
          >
            <p className="font-sans  font-bold text-brand">{step.step}</p>
            <h3 className="font-sans  font-bold text-ink">
              {step.title}
            </h3>
            <p className="max-w-[230px] font-sans  font-normal text-ink-muted">
              {step.description}
            </p>
            <span
              aria-hidden
              className="pointer-events-none absolute right-[10px] top-[38px] select-none font-sans  font-extrabold leading-none text-brand-soft"
            >
              {step.number}
            </span>
          </div>
        ))}
      </div> */}

      {/* Programs */}
      <div className="flex flex-col gap-[8px]">
        {programs.map((program, index) => (
          <div key={program.title} className="flex flex-col gap-[8px]">
            <div
              className="flex flex-col gap-[12px] rounded-[16px] border bg-white p-[18px]"
              style={{ borderColor: program.borderColor }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex size-[40px] items-center justify-center rounded-[10px] "
                  style={{ backgroundColor: program.iconBg, color: program.iconColor }}
                >
                  {program.icon}
                </span>
                {program.badge && (
                  <Badge label={program.badge} bg="#fbe3cb" color="#7a4416" />
                )}
              </div>
              <h3 className="font-sans  font-bold text-ink">
                {program.title}
              </h3>
              <p className="font-sans  font-normal text-ink-muted leading-relaxed">
                {program.description}
              </p>
              <div className="flex flex-wrap gap-[6px]">
                {program.tags.map((label) => (
                  <Tag
                    key={label}
                    label={label}
                    bg="#efece3"
                    color="#6a685f"
                    border="#e2ded2"
                  />
                ))}
              </div>
            </div>

            {/* Downward pointing oval pill connector */}
            {index < programs.length - 1 && (
              <div className="flex justify-center py-[2px]">
                <div className="flex h-[26px] w-[62px] items-center justify-center rounded-full border border-border-soft bg-[#fbfaf7] text-brand shadow-[0px_1px_0px_rgba(0,0,0,0.03)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Slogan banner (bleeds past the screen padding) */}
      <div className="-mx-[20px] overflow-x-hidden py-[2px]">
        <div className="rotate-[-0.8deg] bg-brand py-[12px]">
          <p className="whitespace-nowrap text-center font-sans  font-bold tracking-[0.5px] text-white">
            JOIN THE MOVEMENT · AIS UTD · BUILD THE FUTURE
          </p>
        </div>
      </div>

      {/* All Application Sections */}
      <ApplicationSection
        title="Open Applications"
        items={openApplications}
        loading={loading}
        emptyMessage="There are no open applications right now."
      />
      <ApplicationSection
        title="Upcoming Applications"
        items={upcomingApplications}
        loading={loading}
        emptyMessage="There are no upcoming applications."
      />
      <ApplicationSection
        title="Closed Applications"
        items={closedApplications}
        loading={loading}
        emptyMessage="There are no closed applications to show."
      />
      <ApplicationSection
        title="Submitted Applications"
        items={submittedApplications}
        loading={loading}
        emptyMessage="You have not submitted any applications yet."
        buildRowFn={buildSubmittedRow}
      />

      <BottomNav />
    </MobileScreen>
  );
}
