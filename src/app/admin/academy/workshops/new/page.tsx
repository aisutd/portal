import type { Metadata } from "next";
import Link from "next/link";
import { AdminAcademyShell } from "@/components/admin/academy-shell";
import { WorkshopForm } from "@/components/admin/workshop-form";
import { RecordingCard } from "@/components/admin/recording-card";
import { CoverPhotoCard } from "@/components/admin/cover-photo-card";
import { SettingsCard, type SettingRow } from "@/components/admin/settings-card";
import { EventActionButtons } from "@/components/admin/admin-event-actions";
import { createWorkshop } from "@/app/admin/academy/actions";
import { eventTags } from "@/lib/data";
import { getAdminViewer } from "@/lib/admin-access";

export const metadata: Metadata = {
  title: "AIS Admin — Create Workshop",
  description: "Create and publish a new AI Academy workshop.",
};

export default async function CreateWorkshopPage() {
  const viewer = await getAdminViewer();

  const settings: SettingRow[] = [
    {
      label: "Workshop Visibility",
      type: "badge",
      badge: "draft",
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
          Create Workshop
        </h2>
      </div>

      <form
        action={createWorkshop}
        className="flex w-full flex-col gap-6 lg:flex-row lg:items-start"
      >
        <WorkshopForm tags={eventTags} />

        <div className="flex w-full flex-col gap-5 lg:w-[382px] lg:shrink-0">
          <CoverPhotoCard defaultImageUrl={null} />
          <RecordingCard />
          <SettingsCard items={settings} />

          <div className="flex flex-col gap-2.5">
            <EventActionButtons
              isPublished={false}
              userRole={viewer?.role}
              cancelHref="/admin/academy/workshops"
              noun="workshop"
            />
          </div>
        </div>
      </form>
    </AdminAcademyShell>
  );
}
