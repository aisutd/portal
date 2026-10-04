import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminViewer } from "@/lib/admin-access";
import { AdminAcademyShell } from "@/components/admin/academy-shell";
import { WorkshopForm } from "@/components/admin/workshop-form";
import { RecordingCard } from "@/components/admin/recording-card";
import { CoverPhotoCard } from "@/components/admin/cover-photo-card";
import { SettingsCard, type SettingRow } from "@/components/admin/settings-card";
import { EventActionButtons } from "@/components/admin/admin-event-actions";
import { DeleteEventButton } from "@/components/admin/delete-event-button";
import { deleteWorkshop, updateWorkshop } from "@/app/admin/academy/actions";
import { canPublishAcademy } from "@/lib/roles";
import { eventTags } from "@/lib/data";
import { utcToChicagoInput } from "@/lib/timezone";

export const metadata: Metadata = {
  title: "AIS Admin — Edit Workshop",
  description: "Edit an existing AI Academy workshop.",
};

export default async function EditWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getAdminViewer();
  const { id } = await params;

  const workshop = await prisma.workshop.findUnique({
    where: { id },
    include: {
      quiz: { select: { isPublished: true } },
    },
  });

  if (!workshop) return notFound();

  // Matches events: officers draft, but cannot revise something already live.
  if (workshop.isPublished && viewer?.role === "OFFICER") {
    redirect("/admin/academy/workshops");
  }

  const defaultValues = {
    title: workshop.title,
    description: workshop.description ?? "",
    location: workshop.location ?? "TBD",
    startTime: utcToChicagoInput(workshop.startTime),
    endTime: utcToChicagoInput(workshop.endTime),
  };

  const quiz = workshop.quiz;
  const quizStatus = !quiz
    ? "Members who missed this can make up attendance."
    : quiz.isPublished
      ? "Live — members can take it now."
      : "Saved, but not yet visible to members.";

  const settings: SettingRow[] = [
    {
      label: "Workshop Visibility",
      type: "badge",
      badge: workshop.isPublished ? "Public" : "Draft",
    },
  ];

  return (
    <AdminAcademyShell>
      <div>
        <Link
          href="/admin/academy/workshops"
          className="style-caption leading-[16.8px] tracking-[0.2px] text-brand"
        >
          ← Back to Workshops
        </Link>
        <h2 className="mt-[6px] style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
          Edit Workshop
        </h2>
      </div>

      <form
        action={updateWorkshop}
        className="flex w-full flex-col gap-6 lg:flex-row lg:items-start"
      >
        <input type="hidden" name="id" value={workshop.id} />

        <WorkshopForm tags={eventTags} defaultValues={defaultValues}/>

        <div className="flex w-full flex-col gap-5 lg:w-[382px] lg:shrink-0">
          <CoverPhotoCard defaultImageUrl={workshop.imageUrl} />
          <RecordingCard
            defaultRecordingUrl={workshop.recordingUrl}
            defaultSummary={workshop.summary}
            defaultQuizDueAt={
              workshop.quizDueAt
                ? utcToChicagoInput(workshop.quizDueAt)
                : ""
            }
          />
          {/* The quiz saves through its own endpoint, so this leaves the
              form rather than submitting it. */}
          <Link
            href={`/admin/academy/workshops/${workshop.id}/quiz`}
            className="flex items-center justify-between gap-3 rounded-[16px] border border-border-soft bg-white p-5 shadow-sm transition-colors hover:border-brand"
          >
            <span className="flex flex-col gap-0.5">
              <span className="style-body-text font-semibold text-ink">
                {quiz ? "Edit attendance quiz" : "Add an attendance quiz"}
              </span>
              <span className="style-caption text-ink-faint">{quizStatus}</span>
            </span>
            <span aria-hidden className="style-body-text text-brand">
              →
            </span>
          </Link>

          <SettingsCard items={settings} />

          <div className="flex flex-col gap-2.5">
            <EventActionButtons
              isPublished={workshop.isPublished}
              userRole={viewer?.role}
              cancelHref="/admin/academy/workshops"
              noun="workshop"
            />

            {canPublishAcademy(viewer?.role ?? "") && (
              <div className="mt-4 border-t border-border-soft pt-4">
                <DeleteEventButton
                  eventId={workshop.id}
                  deleteAction={deleteWorkshop}
                  noun="workshop"
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </AdminAcademyShell>
  );
}
