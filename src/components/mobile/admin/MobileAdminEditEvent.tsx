import type { EventTag, MembershipType, TEAM, UserRole } from "@prisma/client";
import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";
import { CoverPhotoCard } from "@/components/admin/cover-photo-card";
import { SettingRow, SettingsCard } from "@/components/admin/settings-card";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { eventTags } from "@/lib/data";
import { updateEvent, deleteEvent } from "@/app/admin/events/[id]/edit/actions";
import { DeleteEventButton } from "@/components/admin/delete-event-button";
import { EventActionButtons } from "@/components/admin/admin-event-actions";

type EventDefaultValues = {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: string;
  status: string;
  visibility: string;
  isRsvpOpen: boolean;
  imageUrl?: string | null;
  tags: EventTag[];
  visibilityRoles?: UserRole[];
  visibilityMembership?: MembershipType[];
  visibilityTeams?: TEAM[];
  items: Array<{ name: string; type: "MEAL" | "DRINK" | "MERCH" | "OTHER" }>;
};

type MobileAdminEditEventProps = {
  eventId: string;
  defaultValues: EventDefaultValues;
  isPublished: boolean;
  userRole: string;
  eventSettings: SettingRow[];
};

export function MobileAdminEditEvent({ eventId, defaultValues, isPublished, userRole, eventSettings }: MobileAdminEditEventProps) {
  // defaultValues is already converted to CT string format by EditEventPage
  return (
    <MobileScreen withBottomNavPadding={false} backgroundColor="bg-cream">
      <MobileAdminNav active="Events" />

      <div>
        <Link href="/admin/events" className="style-caption text-brand">
          ← Back to Events
        </Link>
        <h2 className="mt-1.5 style-mobile-title text-ink">
          Edit Event
        </h2>
      </div>

      <form action={updateEvent} className="flex flex-col gap-6">
        <input type="hidden" name="id" value={eventId} />

        <CoverPhotoCard defaultImageUrl={defaultValues.imageUrl} />
        <EventForm tags={eventTags} defaultValues={defaultValues} />
        <SettingsCard items={eventSettings} />

        <div className="flex flex-col gap-2.5">
          <EventActionButtons isPublished={isPublished} userRole={userRole}/>
          
          {userRole === "EXECUTIVE" && (
            <div className="mt-2 border-t border-border-soft pt-4">
              <DeleteEventButton eventId={eventId} deleteAction={deleteEvent} />
            </div>
          )}
        </div>
      </form>
    </MobileScreen>
  );
}