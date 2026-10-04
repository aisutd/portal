export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminAcademyShell } from "@/components/admin/academy-shell";
import { AcademyTabs } from "@/components/admin/academy-tabs";
import { StatCard } from "@/components/admin/stat-card";
import { WorkshopRow, type WorkshopRowData } from "@/components/admin/workshow-row";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "AIS Admin — Academy Workshops",
  description: "Manage AI Academy workshops, recordings, and quizzes.",
};

type WorkshopWithRelations = Prisma.WorkshopGetPayload<{
  include: {
    attendances: true;
    quiz: { select: { isPublished: true } };
  };
}>;

function toDisplayStatus(workshop: { startTime: Date; endTime: Date; isPublished: boolean }) {
  if (!workshop.isPublished) {
    return { label: "Draft", bg: "#f3f4f6", color: "#4b5563" };
  }
  const now = new Date();
  if (now < new Date(workshop.startTime)) return { label: "Upcoming", bg: "#e1e8ff", color: "#1f3aa3" };
  if (now > new Date(workshop.endTime)) return { label: "Past", bg: "#efece3", color: "#8a8a93" };
  return { label: "Live", bg: "#d2ecd9", color: "#2c5d3e" };
}

function mapWorkshopToRow(workshop: WorkshopWithRelations): WorkshopRowData {
  const now = new Date();
  const isPast = new Date(workshop.endTime) < now;

  const attendedCount = workshop.attendances.length;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(workshop.startTime));

  const hasRecording = Boolean(workshop.recordingUrl);
  const quiz = workshop.quiz;
  const quizLabel = !quiz ? "no quiz" : quiz.isPublished ? "quiz live" : "quiz unpublished";

  const leftInfo = isPast
    ? `${attendedCount} attended · ${hasRecording ? "recording added" : "no recording yet"} · ${quizLabel}`
    : `${attendedCount} checked in · ${quizLabel}`;

  return {
    id: workshop.id,
    imageUrl: workshop.imageUrl,
    title: workshop.title,
    status: toDisplayStatus(workshop),
    meta: `${formattedDate} · ${workshop.location}`,
    leftInfo,
    rightInfo: `${attendedCount} Attended`,
    progress: 0,
    progressFill: isPast ? "#8a8a93" : "#2f5fe8",
    dim: isPast,
    actions: [
      { label: "QR", variant: "primary", href: `/admin/academy/workshops/${workshop.id}/check-in` },
      { label: "Scan", variant: "primary", href: `/admin/academy/workshops/${workshop.id}/scan` },
      { label: "Quiz", variant: "accent", href: `/admin/academy/workshops/${workshop.id}/quiz` },
      { label: "Edit", variant: "ghost", href: `/admin/academy/workshops/${workshop.id}/edit` },
    ],
  };
}

async function getWorkshopViewModel() {
  const now = new Date();

  const workshops = await prisma.workshop.findMany({
    orderBy: { startTime: "asc" },
    include: {
      attendances: true,
      quiz: {
        select: { isPublished: true },
      },
    },
  });

  const published = workshops.filter((w) => w.isPublished);
  const drafts = workshops.filter((w) => !w.isPublished);

  const live = published.filter(
    (w) => new Date(w.startTime) <= now && new Date(w.endTime) >= now
  );
  const upcoming = published.filter((w) => new Date(w.startTime) > now);
  const past = published.filter((w) => new Date(w.endTime) < now);

  const totalAttendees = workshops.reduce(
    (sum, w) => sum + w.attendances.length,
    0
  );

  const withRecording = past.filter((w) => Boolean(w.recordingUrl)).length;
  const recordingCoverage =
    past.length > 0 ? Math.round((withRecording / past.length) * 100) : 0;

  return {
    stats: [
      { value: String(published.length), label: "published" },
      { value: String(drafts.length), label: "drafts" },
      { value: String(totalAttendees), label: "total attendees" },
      { value: `${recordingCoverage}%`, label: "recordings posted", highlight: true },
    ],
    publishedRows: [...live, ...upcoming].map(mapWorkshopToRow),
    draftRows: drafts.map(mapWorkshopToRow),
    pastRows: past.map(mapWorkshopToRow),
  };
}

export default async function AdminAcademyWorkshopsPage() {
  const data = await getWorkshopViewModel();

  return (
    <AdminAcademyShell>
      <AcademyTabs active="Workshops" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
          Workshops
        </h2>
        <div className="flex items-center gap-[10px]">
          <Link href="/admin/academy/workshops/new">
            <Button variant="primary" size="md">
              + New Workshop
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-[12px] lg:flex lg:gap-[16px]">
        {data.stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="flex flex-col gap-[12px]">
        <h3 className="style-section-header text-ink">
          Published Workshops ({data.publishedRows.length})
        </h3>
        {data.publishedRows.length > 0 ? (
          data.publishedRows.map((w) => <WorkshopRow key={w.id} {...w} />)
        ) : (
          <p className="rounded-xl border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
            No active or upcoming published workshops.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-[12px] pt-4">
        <h3 className="style-section-header text-ink">
          Drafts ({data.draftRows.length})
        </h3>
        {data.draftRows.length > 0 ? (
          data.draftRows.map((w) => <WorkshopRow key={w.id} {...w} />)
        ) : (
          <p className="rounded-xl border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
            No draft workshops saved.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-[12px] pt-4">
        <h3 className="style-section-header text-ink-muted">
          Past Workshops ({data.pastRows.length})
        </h3>
        {data.pastRows.length > 0 ? (
          <div className="flex flex-col gap-[12px]">
            {data.pastRows.map((w) => <WorkshopRow key={w.id} {...w} />)}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
            No past workshops recorded.
          </p>
        )}
      </div>

      <Link href="/admin/academy/workshops/new" className="mt-2 block w-full">
        <div className="flex w-full flex-col gap-1 rounded-[16px] bg-brand px-5 py-4 transition-opacity hover:opacity-95 md:flex-row md:items-center md:justify-between md:px-[23px] md:py-[21px]">
          <span className="style-section-header leading-[21.25px] text-white [font-variation-settings:'wdth'_100]">
            + Create a new workshop
          </span>
          <span className="style-caption leading-[16.8px] tracking-[0.2px] text-white/80">
            title · date · location · recording · quiz
          </span>
        </div>
      </Link>
    </AdminAcademyShell>
  );
}
