import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QRScannerClient } from "@/components/admin/qr-scanner";
import { MobileAdminScan } from "@/components/mobile/admin/MobileAdminScan";

export const metadata: Metadata = {
  title: "AIS Admin — AIM Attendance Scan",
};

export default async function AimEventScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) return notFound();

  return (
    <>
      <div className="md:hidden">
        <MobileAdminScan eventTitle={event.title} eventId={event.id} items={[]} />
      </div>

      <div className="hidden md:block">
        <div className="flex h-full flex-1 flex-col gap-5 p-12">
          <div>
            <Link href="/admin/aim" className="style-caption text-xs text-brand tracking-wide">
              ← Back to AIM
            </Link>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">
              Scanner: {event.title}
            </h2>
          </div>

          <div className="flex mt-4 flex-col items-center justify-center">
            <QRScannerClient eventId={event.id} items={[]} />
          </div>
        </div>
      </div>
    </>
  );
}
