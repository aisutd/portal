import Link from "next/link";
import { QRScannerClient } from "@/components/admin/qr-scanner";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import type { ItemType } from "@prisma/client";

type MobileAdminScanProps = {
  eventTitle: string;
  eventId: string;
  items: Array<{ id: string; name: string; type: ItemType }>;
};

export function MobileAdminScan({ eventTitle, eventId, items }: MobileAdminScanProps) {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Events" />

      <div>
        <Link href="/admin/events" className="font-mono  text-brand">
          ← Back to Events
        </Link>
        <h2 className="mt-[6px] font-mobile-display  font-bold text-ink">
          Scanner: {eventTitle}
        </h2>
      </div>

      <div className="flex flex-col items-center">
        <QRScannerClient eventId={eventId} items={items} />
      </div>
    </MobileScreen>
  );
}
