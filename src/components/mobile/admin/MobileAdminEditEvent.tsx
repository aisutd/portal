import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/admin/event-form";
import { CoverPhotoCard } from "@/components/admin/cover-photo-card";
import { SettingsCard } from "@/components/admin/settings-card";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { eventTags, eventSettings } from "@/lib/data";
import { updateEvent } from "@/app/admin/events/[id]/edit/actions";

type EventDefaultValues = {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: string;
  status: string;
  visibility: string;
  tags: string[];
  items: Array<{ name: string; type: "MEAL" | "DRINK" | "MERCH" | "OTHER" }>;
};

type MobileAdminEditEventProps = {
  eventId: string;
  defaultValues: EventDefaultValues;
};

export function MobileAdminEditEvent({ eventId, defaultValues }: MobileAdminEditEventProps) {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Events" />

      <div>
        <Link href="/admin/events" className="font-mono text-[11px] text-brand">
          ← Back to Events
        </Link>
        <h2 className="mt-[6px] font-mobile-display text-[20px] font-bold text-ink">
          Edit Event
        </h2>
      </div>

      <form action={updateEvent} className="flex flex-col gap-[24px]">
        <input type="hidden" name="id" value={eventId} />

        <EventForm tags={eventTags} defaultValues={defaultValues} />
        <CoverPhotoCard />
        <SettingsCard items={eventSettings} />

        <div className="flex gap-[10px]">
          <Link href="/admin/events" className="flex-1">
            <Button type="button" variant="ghost" size="md" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="md" className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </MobileScreen>
  );
}
