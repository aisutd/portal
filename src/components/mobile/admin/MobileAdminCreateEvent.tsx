import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";
import { CoverPhotoCard } from "@/components/admin/cover-photo-card";
import { SettingsCard } from "@/components/admin/settings-card";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { eventTags, eventSettings } from "@/lib/data";
import { createEvent } from "@/app/admin/events/actions";
import { EventActionButtons } from "@/components/admin/admin-event-actions";

interface MobileAdminCreateEventProps {
  userRole?: string;
}

export function MobileAdminCreateEvent({userRole}: MobileAdminCreateEventProps) {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Events" />

      <div>
        <Link href="/admin/events" className="style-caption text-brand">
          ← Back to Events
        </Link>
        <h2 className="mt-1.5 style-mobile-title text-ink">
          Create Event
        </h2>
      </div>

      <form 
        action={createEvent} 
        // encType="multipart/form-data" 
        className="flex flex-col gap-6"
      >
        <EventForm tags={eventTags} />
        <CoverPhotoCard defaultImageUrl={null} />
        <SettingsCard items={eventSettings} />

        <div className="flex flex-col gap-2.5">
          <EventActionButtons isPublished={false} userRole={userRole}/>
        </div>
      </form>
    </MobileScreen>
  );
}