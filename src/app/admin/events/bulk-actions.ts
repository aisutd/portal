"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import { canManageEventArchive } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { deleteEventRecords } from "@/lib/admin/delete-events";

export async function manageEvents(ids: string[], action: string, archived = false) {
  const user = await getAuthenticatedUser();
  if (!canManageEventArchive(user?.role)) throw new Error("Unauthorized action.");
  if (!Array.isArray(ids) || !ids.length || ids.some((id) => typeof id !== "string" || !id)) throw new Error("Select events first.");
  const allowed = archived ? ["restore", "delete"] : ["archive", "delete", "publish", "unpublish"];
  if (!allowed.includes(action)) throw new Error("Invalid event action.");
  const uniqueIds = [...new Set(ids)];
  const events = await prisma.event.findMany({ where: { id: { in: uniqueIds }, isArchived: archived }, select: { id: true } });
  if (events.length !== uniqueIds.length) throw new Error("Events have changed. Refresh and try again.");
  if (action === "delete") {
    await deleteEventRecords(uniqueIds);
  } else {
    const data = action === "archive" ? { isArchived: true, isPublished: false }
      : action === "restore" ? { isArchived: false, isPublished: false }
      : { isPublished: action === "publish" };
    await prisma.event.updateMany({ where: { id: { in: uniqueIds }, isArchived: archived }, data });
  }
  revalidatePath("/admin/events", "layout");
  revalidatePath("/events");
}
