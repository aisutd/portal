import type { Metadata } from "next";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { EventForm } from "@/components/admin/event-form";
import { CoverPhotoCard } from "@/components/admin/cover-photo-card";
import { SettingsCard } from "@/components/admin/settings-card";
import { Button } from "@/components/ui/button";
import { MobileAdminCreateEvent } from "@/components/mobile/admin/MobileAdminCreateEvent";
import { eventTags, eventSettings } from "@/lib/data";
import { createEvent } from "@/app/admin/events/actions";

export const metadata: Metadata = {
  title: "AIS Admin — Create Event",
  description: "Create and publish a new AIS event.",
};

export default function CreateEventPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileAdminCreateEvent />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full bg-cream">
          <AdminSidebar active="Events" role="Officer" />

          <div className="flex h-full flex-1 flex-col gap-[20px] p-[46px]">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/admin/events"
                  className="font-mono  leading-[16.8px] tracking-[0.2px] text-brand"
                >
                  ← Back to Events
                </Link>
                <h2 className="mt-[6px] font-display  font-bold leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                  Create Event
                </h2>
              </div>
            </div>

            <form action={createEvent} className="flex w-full flex-col gap-[24px] lg:flex-row lg:items-start">
              <EventForm tags={eventTags} />
              <div className="flex w-full flex-col gap-[20px] lg:w-[382px] lg:shrink-0">
                <CoverPhotoCard />
                <SettingsCard items={eventSettings} />
                
                <div className="flex gap-[10px]">
                  {/* Save Draft Button passes action: 'draft' */}
                  <Button 
                    type="submit" 
                    name="action" 
                    value="draft" 
                    variant="ghost" 
                    size="md"
                    className="flex-1"
                  >
                    Save draft
                  </Button>

                  {/* Publish Button passes action: 'publish' */}
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
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}