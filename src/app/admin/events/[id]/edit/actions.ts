"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ItemType } from "@prisma/client";
import { isAssignableProgram } from "@/lib/roles";
import { putObjectToR2 } from "@/lib/r2";

type EventItemInput = {
  name: string;
  type: ItemType;
};

function isImageFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

async function resolveEventImageUrl(
  file: FormDataEntryValue | null,
  existingImageUrl?: string | null
): Promise<string | null> {
  if (!isImageFile(file)) {
    return existingImageUrl ?? null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Event cover must be an image file.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Event cover image must be under 8 MB.");
  }

  const cleanFileName = file.name
  .toLowerCase()
  .replace(/\s+/g, "-")            // Convert spaces to hyphens
  .replace(/[^a-z0-9\.-]/g, "");   // Remove special characters

  const key = `events/${Date.now()}-${cleanFileName}`;
  const data = Buffer.from(await file.arrayBuffer());

  const publicUrl = await putObjectToR2(key, data, file.type || "image/jpeg");

  if (!publicUrl) {
    throw new Error("Failed to upload image to Cloudflare R2 storage.");
  }

  console.log(file);
  console.log("Uploaded image to Cloudflare successfully!");
  console.log(publicUrl);
  return publicUrl;
}

export async function updateEvent(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("Event ID is required.");

  // Extract submission action button value ("draft", "publish", "unpublish")
  const action = String(formData.get("action") ?? "");

  // Extract and parse form fields
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const startTimeInput = formData.get("startTime") as string;
  const endTimeInput = formData.get("endTime") as string;

  // Preserve existing imageUrl if no new file is provided
  const existingEvent = await prisma.event.findUnique({
    where: { id },
    select: { imageUrl: true, isPublished: true },
  });

  // Resolve new image upload if an image file was selected
  const imageUrl = await resolveEventImageUrl(
    formData.get("image"),
    existingEvent?.imageUrl ?? null
  );

  // Helper to force interpretation of datetime-local as Central Time
  const parseCentralTime = (dateStr: string) => {
    if (!dateStr) return new Date();
    const cleanDate = dateStr.replace("Z", "");
    const month = new Date(cleanDate).getMonth();
    const isDst = month >= 2 && month <= 10;
    const offset = isDst ? "-05:00" : "-06:00";
    return new Date(`${cleanDate}:00${offset}`);
  };

  const startTime = parseCentralTime(startTimeInput);
  const endTime = parseCentralTime(endTimeInput);

  const capacityStr = formData.get("capacity") as string;
  const capacity = capacityStr ? parseInt(capacityStr, 10) : null;

  const status = formData.get("status") as string;
  const visibility = formData.get("visibility") as string;

  // Tags come through as a comma-separated string from the hidden input
  const tagsString = formData.get("tags") as string;
  const tags = tagsString ? tagsString.split(",").filter(Boolean) : [];

  // Programs the event counts toward for member status
  const programsString = formData.get("programs") as string;
  const programs = programsString
    ? programsString
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(isAssignableProgram)
    : [];

  // Extract and parse event items from JSON
  const eventItemsJson = formData.get("eventItems") as string;
  const eventItems: EventItemInput[] = eventItemsJson ? JSON.parse(eventItemsJson) : [];

  // Determine isPublished state
  let isPublished: boolean;
  if (action === "publish") {
    isPublished = true;
  } else if (action === "unpublish") {
    isPublished = false;
  } else {
    isPublished = existingEvent?.isPublished ?? false;
  }

  // Update event with imageUrl included
  await prisma.event.update({
    where: { id },
    data: {
      title,
      description,
      location,
      startTime,
      endTime,
      capacity,
      status: status as any,
      visibility: visibility as any,
      imageUrl, // Saved to DB
      tags: tags as any,
      programs,
      isPublished,

      items: {
        deleteMany: {},
        create: eventItems.map((item) => ({
          name: item.name,
          type: item.type,
        })),
      },
    },
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}/edit`);
  revalidatePath(`/admin/events/${id}/scan`);

  redirect("/admin/events");
}

export async function deleteEvent(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) throw new Error("Event ID is required for deletion");

  // Delete associated attendance records first
  await prisma.attendance.deleteMany({
    where: { rsvp: { eventId: id } },
  });

  // Delete associated RSVPs
  await prisma.rSVP.deleteMany({
    where: { eventId: id },
  });

  // Delete associated event items
  const items = await prisma.eventItem.findMany({ where: { eventId: id } });
  const itemIds = items.map((item) => item.id);

  if (itemIds.length > 0) {
    await prisma.itemScan.deleteMany({
      where: { eventItemId: { in: itemIds } },
    });
    await prisma.eventItem.deleteMany({
      where: { eventId: id },
    });
  }

  // Delete the event
  await prisma.event.delete({
    where: { id },
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}/edit`);
  redirect("/admin/events");
}