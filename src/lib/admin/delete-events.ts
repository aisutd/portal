import { prisma } from "@/lib/prisma";
import { deleteObjectFromR2 } from "@/lib/r2";
import { extractStorageKeyFromUrl } from "@/lib/admin/event-form-parsing";

/** Shared deletion of selected records and their associated data. */
export async function deleteEventRecords(ids: string[]) {
  const events = await prisma.event.findMany({ where: { id: { in: ids } }, select: { imageUrl: true } });
  await prisma.$transaction([
    prisma.rSVP.deleteMany({ where: { eventId: { in: ids } } }),
    prisma.event.deleteMany({ where: { id: { in: ids } } }),
  ]);
  for (const event of events) {
    const key = event.imageUrl && extractStorageKeyFromUrl(event.imageUrl);
    if (key) await deleteObjectFromR2(key).catch((err) => console.error("Failed to delete event image from R2:", err));
  }
}
