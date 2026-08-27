import { Badge } from "@/components/ui/badge";
import type { OpenApp } from "@/components/apply/open-app-row";

export type Application = {
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

export function formatDateTime(value: string) {
  const date = new Date(value);
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
}

export function getStatusBadge(
  draft: Application["draft"],
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

export function sortApplications(
  items: Application[],
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

      return leftDate - rightDate;
    });
}

export function sortSubmittedApplications(items: Application[]) {
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

export function buildOpenRow(application: Application): OpenApp {
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
    metaMedium: application.phase !== "upcoming",
    dim: application.phase !== "open",
    statusBadge: getStatusBadge(application.draft, application.submissionStatus),
    actions,
  };
}

export function buildSubmittedRow(application: Application): OpenApp {
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
