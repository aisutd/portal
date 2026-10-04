import Link from "next/link";
import { QRScannerClient } from "@/components/admin/qr-scanner";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import type { ItemType } from "@prisma/client";

type MobileWorkshopScanProps = {
  workshopTitle: string;
  workshopId: string;
  items: Array<{ id: string; name: string; type: ItemType }>;
};

export function MobileWorkshopScan({ workshopTitle, workshopId, items }: MobileWorkshopScanProps) {
  return (
    <MobileScreen withBottomNavPadding={false} backgroundColor="bg-cream">
      {/* Update active state based on your MobileAdminNav options (e.g., "Academy" or "Workshops") */}
      <MobileAdminNav active="Academy" />

      <div>
        <Link href="/admin/academy/workshops" className="style-caption text-brand">
          ← Back to Workshops
        </Link>
        <h2 className="mt-[6px] style-mobile-title text-ink">
          Scanner: {workshopTitle}
        </h2>
      </div>

      <div className="flex flex-col items-center">
        {/* We map workshopId to eventId since QRScannerClient uses eventId as its generic ID prop */}
        <QRScannerClient eventId={workshopId} items={items} />
      </div>
    </MobileScreen>
  );
}