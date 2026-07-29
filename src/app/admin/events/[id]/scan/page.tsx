import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QRScannerClient } from "@/components/admin/qr-scanner";

export const metadata: Metadata = {
  title: "AIS Admin — Scan & Perks",
};

export default async function EventScanPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!event) return notFound();

  return (
    <div className="flex h-full flex-1 flex-col gap-5 p-[46px]">
      <div>
        <Link href="/admin/events" className="font-mono text-xs text-brand tracking-wide">
          ← Back to Events
        </Link>
        <h2 className="mt-2 font-display text-3xl font-bold text-ink">
          Scanner: {event.title}
        </h2>
      </div>

      <div className="flex mt-4 flex-col items-center justify-center">
        <QRScannerClient 
          eventId={event.id} 
          items={event.items.map(i => ({ 
            id: i.id, 
            name: i.name, 
            type: i.type 
          }))} 
        />
      </div>
    </div>
  );
}