import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { EventForm } from "@/components/admin/event-form";
import { CoverPhotoCard } from "@/components/admin/cover-photo-card";
import { SettingsCard } from "@/components/admin/settings-card";
import { Button } from "@/components/ui/button";
import { MobileAdminEditEvent } from "@/components/mobile/admin/MobileAdminEditEvent";
import { eventTags, eventSettings } from "@/lib/data";
import { updateEvent, deleteEvent } from "./actions";
import { DeleteEventButton } from "@/components/admin/delete-event-button";
import { EventActionButtons } from "@/components/admin/admin-event-actions";

export const metadata: Metadata = {
  title: "AIS Admin — Edit Event",
  description: "Edit an existing AIS event.",
};

/** Formats date explicitly into Chicago timezone YYYY-MM-DDTHH:mm */
function formatChicagoDateTimeInput(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const hour = partMap.hour === "24" ? "00" : partMap.hour;
  return `${partMap.year}-${partMap.month}-${partMap.day}T${hour}:${partMap.minute}`;
}

export default async function EditEventPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== "EXECUTIVE" && user.role !== "OFFICER")) {
    redirect("/onboarding");
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!event) return notFound();

  const defaultValues = {
    title: event.title,
    description: event.description ?? "",
    location: event.location,
    startTime: formatChicagoDateTimeInput(event.startTime),
    endTime: formatChicagoDateTimeInput(event.endTime),
    capacity: event.capacity?.toString() ?? "",
    status: event.status as string,
    visibility: event.visibility as string,
    imageUrl: event.imageUrl,
    tags: event.tags as string[],
    programs: event.programs,
    items: event.items.map((i) => ({
      name: i.name,
      type: i.type as "MEAL" | "DRINK" | "MERCH" | "OTHER",
    })),
  };

  return (
    <>
      <div className="md:hidden">
        <MobileAdminEditEvent 
          eventId={event.id} 
          defaultValues={defaultValues} 
          isPublished={event.isPublished} 
          userRole={user.role}
        />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full bg-cream">
          <AdminSidebar active="Events" role={user.role} />

          <div className="flex h-full flex-1 flex-col gap-[20px] p-[46px]">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/admin/events"
                  className="style-caption leading-[16.8px] tracking-[0.2px] text-brand"
                >
                  ← Back to Events
                </Link>
                <h2 className="mt-[6px] style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                  Edit Event
                </h2>
              </div>
            </div>

            <form 
              action={updateEvent}
              // encType="multipart/form-data"
              className="flex w-full flex-col gap-6 lg:flex-row lg:items-start"
            >
              <input type="hidden" name="id" value={event.id} />

              <EventForm tags={eventTags} defaultValues={defaultValues} />

              <div className="flex w-full flex-col gap-5 lg:w-[382px] lg:shrink-0">
                <CoverPhotoCard defaultImageUrl={event.imageUrl} />
                <SettingsCard items={eventSettings} />
                
                <div className="flex flex-col gap-2.5">
                  <EventActionButtons isPublished={event.isPublished} userRole={user.role}/>

                  <div className="mt-4 border-t border-border-soft pt-4">
                    <DeleteEventButton eventId={event.id} deleteAction={deleteEvent} />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}