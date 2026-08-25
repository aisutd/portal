import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { EventForm } from "@/components/admin/event-form";
import { CoverPhotoCard } from "@/components/admin/cover-photo-card";
import { SettingsCard } from "@/components/admin/settings-card";
import { Button } from "@/components/ui/button";
import { MobileAdminEditEvent } from "@/components/mobile/admin/MobileAdminEditEvent";
import { eventTags, eventSettings } from "@/lib/data";
import { updateEvent, deleteEvent } from "./actions";
import { DeleteEventButton } from "@/components/admin/delete-event-button"

export const metadata: Metadata = {
  title: "AIS Admin — Edit Event",
  description: "Edit an existing AIS event.",
};

export default async function EditEventPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!event) return notFound();

  // Format dates for HTML datetime-local inputs
  const formatDateTime = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const defaultValues = {
    title: event.title,
    description: event.description ?? "",
    location: event.location,
    startTime: formatDateTime(event.startTime),
    endTime: formatDateTime(event.endTime),
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
        isPublished={event.isPublished} />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full bg-cream">
          <AdminSidebar active="Events" role="Officer" />

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

            <form action={updateEvent} 
              //encType="multipart/form-data"
              className="flex w-full flex-col gap-6 lg:flex-row lg:items-start"
            >
              {/* Hidden input to pass the event ID to the server action */}
              <input type="hidden" name="id" value={event.id} />

              <EventForm tags={eventTags} defaultValues={defaultValues} />

              <div className="flex w-full flex-col gap-5 lg:w-[382px] lg:shrink-0">
                <CoverPhotoCard defaultImageUrl={event.imageUrl} />
                <SettingsCard items={eventSettings} />
                
                <div className="flex flex-col gap-[10px]">
                  <div className="flex gap-[10px]">
                    <Button 
                      type="submit" 
                      name="action" 
                      value="draft" 
                      variant="ghost" 
                      size="md" 
                      className="flex-1"
                    >
                      Save changes
                    </Button>

                    {event.isPublished ? (
                      <Button 
                        type="submit" 
                        name="action" 
                        value="unpublish" 
                        variant="accent" 
                        size="md"
                        className="flex-1"
                      >
                        Unpublish
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        name="action" 
                        value="publish" 
                        variant="primary" 
                        size="md"
                        className="flex-1"
                      >
                        Publish
                      </Button>
                    )}
                  </div>

                  <Link href="/admin/events" className="w-full">
                    <Button type="button" variant="ghost" size="md" className="w-full text-ink-faint">
                      Cancel
                    </Button>
                  </Link>

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