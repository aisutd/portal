"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ItemType } from "@prisma/client";
import { isAssignableProgram } from "@/lib/roles";
import { putObjectToR2, deleteObjectFromR2 } from "@/lib/r2"; // Assumes deleteObjectFromR2 is exported

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

type EventItemInput = {
  name: string;
  type: ItemType;
};

export type ActionResponse = {
  success: boolean;
  error?: string;
};

function isImageFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

/**
 * Extracts the R2 storage key from a full public R2 URL.
 */
function extractStorageKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Returns key starting after the leading slash (e.g., "events/12345-image.png")
    return parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
  } catch {
    return null;
  }
}

async function resolveEventImageUrl(
  fileEntry: FormDataEntryValue | null,
  existingImageUrl?: string | null
): Promise<{ imageUrl: string | null; error?: string }> {
  // If no file uploaded or invalid entry type, keep existing image
  if (!fileEntry || !(fileEntry instanceof File) || fileEntry.size === 0) {
    return { imageUrl: existingImageUrl ?? null };
  }

  // 1. Hard check file MIME type
  if (!fileEntry.type.startsWith("image/")) {
    return { imageUrl: existingImageUrl ?? null, error: "Event cover must be an image file." };
  }

  // 2. Hard check size BEFORE reading into memory or uploading to R2
  if (fileEntry.size > MAX_FILE_SIZE) {
    const sizeInMB = (fileEntry.size / (1024 * 1024)).toFixed(1);
    return { 
      imageUrl: existingImageUrl ?? null, 
      error: `File (${sizeInMB} MB) exceeds the 2 MB limit.` 
    };
  }

  try {
    const cleanFileName = fileEntry.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\.-]/g, "");

    const key = `events/${Date.now()}-${cleanFileName}`;
    const data = Buffer.from(await fileEntry.arrayBuffer());

    const publicUrl = await putObjectToR2(key, data, fileEntry.type || "image/jpeg");

    if (!publicUrl) {
      return { imageUrl: existingImageUrl ?? null, error: "Failed to upload image to R2." };
    }

    // Clean up old image in R2 if replacement succeeded
    if (existingImageUrl) {
      const oldStorageKey = extractStorageKeyFromUrl(existingImageUrl);
      if (oldStorageKey) {
        deleteObjectFromR2(oldStorageKey).catch((err) =>
          console.error("Failed to delete old event image from R2:", err)
        );
      }
    }

    return { imageUrl: publicUrl };
  } catch (err) {
    console.error("Error uploading image:", err);
    return { imageUrl: existingImageUrl ?? null, error: "Failed to upload image file." };
  }
}

export async function updateEvent(formData: FormData): Promise<ActionResponse> {
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "Event ID is required." };

  try {
    const action = String(formData.get("action") ?? "");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const startTimeInput = formData.get("startTime") as string;
    const endTimeInput = formData.get("endTime") as string;

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { imageUrl: true, isPublished: true },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found." };
    }

    // Resolve new image upload safely
    const imageResult = await resolveEventImageUrl(
      formData.get("image"),
      existingEvent.imageUrl
    );

    if (imageResult.error) {
      return { success: false, error: imageResult.error };
    }

    const imageUrl = imageResult.imageUrl;

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

    const tagsString = formData.get("tags") as string;
    const tags = tagsString ? tagsString.split(",").filter(Boolean) : [];

    const programsString = formData.get("programs") as string;
    const programs = programsString
      ? programsString
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter(isAssignableProgram)
      : [];

    let eventItems: EventItemInput[] = [];
    const eventItemsJson = formData.get("eventItems") as string;
    if (eventItemsJson) {
      try {
        eventItems = JSON.parse(eventItemsJson);
      } catch {
        return { success: false, error: "Invalid event items format." };
      }
    }

    let isPublished: boolean;
    if (action === "publish") {
      isPublished = true;
    } else if (action === "unpublish") {
      isPublished = false;
    } else {
      isPublished = existingEvent.isPublished ?? false;
    }

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
        imageUrl,
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
  } catch (error: any) {
    console.error("Failed to update event:", error);
    return { success: false, error: error?.message || "An unexpected error occurred while updating the event." };
  }

  // Next.js redirect must run OUTSIDE the try...catch block
  redirect("/admin/events");
}

export async function deleteEvent(formData: FormData): Promise<ActionResponse> {
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "Event ID is required for deletion." };

  try {
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

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

    // Delete event from DB
    await prisma.event.delete({
      where: { id },
    });

    // Delete image from R2 if one existed
    if (existingEvent?.imageUrl) {
      const oldStorageKey = extractStorageKeyFromUrl(existingEvent.imageUrl);
      if (oldStorageKey) {
        deleteObjectFromR2(oldStorageKey).catch((err) =>
          console.error("Failed to delete event image from R2 on event deletion:", err)
        );
      }
    }

    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}/edit`);
  } catch (error: any) {
    console.error("Failed to delete event:", error);
    return { success: false, error: error?.message || "An unexpected error occurred while deleting the event." };
  }

  // Next.js redirect must run OUTSIDE the try...catch block
  redirect("/admin/events");
}