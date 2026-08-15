import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/admin/event-form";
import { CoverPhotoCard } from "@/components/admin/cover-photo-card";
import { SettingsCard } from "@/components/admin/settings-card";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { eventTags, eventSettings } from "@/lib/data";
import { createEvent } from "@/app/admin/events/actions";

export function MobileAdminCreateEvent() {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Events" />

      <div>
        <Link href="/admin/events" className="font-mono text-[11px] text-brand">
          ← Back to Events
        </Link>
        <h2 className="mt-[6px] font-mobile-display text-[20px] font-bold text-ink">
          Create Event
        </h2>
      </div>

      <form action={createEvent} className="flex flex-col gap-[24px]">
        <EventForm tags={eventTags} />
        <CoverPhotoCard />
        <SettingsCard items={eventSettings} />

        <div className="flex gap-[10px]">
          <Button type="button" variant="ghost" size="md" className="flex-1">
            Save draft
          </Button>
          <Button type="submit" variant="primary" size="md" className="flex-1">
            Publish
          </Button>
        </div>
      </form>
    </MobileScreen>
  );
}
