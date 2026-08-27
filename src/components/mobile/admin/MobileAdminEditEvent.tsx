import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/admin/event-form";
import { CoverPhotoCard } from "@/components/admin/cover-photo-card";
import { SettingsCard } from "@/components/admin/settings-card";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { eventTags, eventSettings } from "@/lib/data";
import { updateEvent, deleteEvent } from "@/app/admin/events/[id]/edit/actions";
import { DeleteEventButton } from "@/components/admin/delete-event-button";

type EventDefaultValues = {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: string;
  status: string;
  visibility: string;
  imageUrl?: string | null;
  tags: string[];
  items: Array<{ name: string; type: "MEAL" | "DRINK" | "MERCH" | "OTHER" }>;
};

type MobileAdminEditEventProps = {
  eventId: string;
  defaultValues: EventDefaultValues;
  isPublished: boolean;
};

/** Formats input values cleanly into Central time */
function toCentralDateTimeInput(dateStr?: string | null): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

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

export function MobileAdminEditEvent({ eventId, defaultValues, isPublished }: MobileAdminEditEventProps) {
  const formattedDefaultValues = {
    ...defaultValues,
    startTime: toCentralDateTimeInput(defaultValues.startTime),
    endTime: toCentralDateTimeInput(defaultValues.endTime),
  };

  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Events" />

      <div>
        <Link href="/admin/events" className="style-caption text-brand">
          ← Back to Events
        </Link>
        <h2 className="mt-[6px] style-mobile-title text-ink">
          Edit Event
        </h2>
      </div>

      <form action={updateEvent} className="flex flex-col gap-6">
        <input type="hidden" name="id" value={eventId} />

        <EventForm tags={eventTags} defaultValues={formattedDefaultValues} />
        <CoverPhotoCard defaultImageUrl={defaultValues.imageUrl} />
        <SettingsCard items={eventSettings} />

        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2.5">
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

            {isPublished ? (
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
          
          <div className="mt-2 border-t border-border-soft pt-4">
            <DeleteEventButton eventId={eventId} deleteAction={deleteEvent} />
          </div>
        </div>
      </form>
    </MobileScreen>
  );
}