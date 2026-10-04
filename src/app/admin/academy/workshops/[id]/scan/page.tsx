// app/admin/academy/workshops/[id]/scan/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QRScannerClient } from "@/components/admin/qr-scanner";
import { MobileWorkshopScan } from "@/components/mobile/admin/MobileWorkshopScan";

export const metadata: Metadata = {
  title: "AIS Admin — Workshop Scan & Perks",
};

export default async function WorkshopScanPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const workshop = await prisma.workshop.findUnique({
    where: { id },
  });

  if (!workshop) return notFound();

  return (
    <>
      <div className="md:hidden">
        <MobileWorkshopScan workshopTitle={workshop.title} workshopId={workshop.id} items={[]} />
      </div>

      <div className="hidden md:block">
        <div className="flex h-full flex-1 flex-col gap-5 p-12">
          <div>
            <Link href="/admin/academy/workshops" className="style-caption text-xs text-brand tracking-wide">
              ← Back to Workshops
            </Link>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">
              Scanner: {workshop.title}
            </h2>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center">
            <QRScannerClient eventId={workshop.id} items={[]} />
          </div>
        </div>
      </div>
    </>
  );
}