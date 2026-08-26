"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EventStatus, EventVisibility, EventTag, ItemType, type MembershipType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { isAssignableProgram } from "@/lib/roles";
import { putObjectToR2, deleteObjectFromR2 } from "@/lib/r2";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

type EventItemInput = {
  name: string;
  type: ItemType;
};

const validTagValues = [
  "FOOD",
  "DRINK",
  "SOCIAL",
  "LEARN",
  "WORKSHOP",
  "NETWORKING",
  "INDUSTRY",
] as const;

function isImageFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

function extractStorageKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
  } catch {
    return null;
  }
}

function parseChicagoTimeToUtc(localDateTimeString: string): Date {
  if (!localDateTimeString) return new Date(NaN);

  const cleanDate = localDateTimeString.replace("Z", "");
  const targetDate = new Date(`${cleanDate}:00Z`);
  if (isNaN(targetDate.getTime())) return new Date(NaN);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    timeZoneName: "shortOffset",
  });

  const parts = formatter.formatToParts(targetDate);
  const timeZoneName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const match = timeZoneName.match(/GMT([+-]\d+)/);

  if (!match) return new Date(`${cleanDate}:00-05:00`);

  const hours = parseInt(match[1], 10);
  const sign = hours >= 0 ? "+" : "-";
  const padHours = Math.abs(hours).toString().padStart(2, "0");

  return new Date(`${cleanDate}:00${sign}${padHours}:00`);
}

function parsePrograms(rawValue: FormDataEntryValue | FormDataEntryValue[] | null): MembershipType[] {
  if (!rawValue) return [];
  const entries = Array.isArray(rawValue) ? rawValue : [rawValue];

  return entries
    .flatMap((entry) => String(entry).split(","))
    .map((value) => value.trim().toUpperCase())
    .filter(isAssignableProgram);
}

function parseTags(rawValue: FormDataEntryValue | FormDataEntryValue[] | null): EventTag[] {
  if (!rawValue) return [];
  const entries = Array.isArray(rawValue) ? rawValue : [rawValue];

  return entries
    .flatMap((entry) => String(entry).split(","))
    .map((tag) => tag.trim().toUpperCase())
    .filter((tag): tag is EventTag => (validTagValues as readonly string[]).includes(tag));
}

async function authorizeAdminUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/onboarding");
  }
  if (user.role !== "EXECUTIVE" && user.role !== "OFFICER") {
    throw new Error("Unauthorized action.");
  }
  return user;
}

async function resolveEventImageUrl(
  fileEntry: FormDataEntryValue | null,
  existingImageUrl?: string | null
): Promise<{ imageUrl: string | null; error?: string }> {
  if (!isImageFile(fileEntry)) {
    return { imageUrl: existingImageUrl ?? null };
  }

  if (!fileEntry.type.startsWith("image/")) {
    return { imageUrl: existingImageUrl ?? null, error: "Event cover must be an image file." };
  }

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

    const key = `events/${Date.now()}-${crypto.randomUUID()}-${cleanFileName}`;
    const data = Buffer.from(await fileEntry.arrayBuffer());

    const publicUrl = await putObjectToR2(key, data, fileEntry.type || "image/jpeg");

    if (!publicUrl) {
      return { imageUrl: existingImageUrl ?? null, error: "Failed to upload image to R2." };
    }

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

export async function updateEvent(formData: FormData): Promise<void> {
  await authorizeAdminUser();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Event ID is required.");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startTimeInput = String(formData.get("startTime") ?? "");
  const endTimeInput = String(formData.get("endTime") ?? "");

  if (!title || !description || !location || !startTimeInput || !endTimeInput) {
    throw new Error("Please fill out all required fields.");
  }

  const existingEvent = await prisma.event.findUnique({
    where: { id },
    select: { imageUrl: true, isPublished: true },
  });

  if (!existingEvent) {
    throw new Error("Event not found.");
  }

  const imageResult = await resolveEventImageUrl(
    formData.get("image"),
    existingEvent.imageUrl
  );

  if (imageResult.error) {
    throw new Error(imageResult.error);
  }

  const parsedStart = parseChicagoTimeToUtc(startTimeInput);
  const parsedEnd = parseChicagoTimeToUtc(endTimeInput);

  if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime()) || parsedEnd <= parsedStart) {
    throw new Error("Please select a valid event window.");
  }

  const capacityStr = formData.get("capacity") as string;
  const parsedCapacity = capacityStr ? parseInt(capacityStr, 10) : null;
  const capacity = parsedCapacity && parsedCapacity > 0 ? parsedCapacity : null;

  const rawStatus = String(formData.get("status") ?? "UPCOMING").toUpperCase();
  const status = Object.values(EventStatus).includes(rawStatus as EventStatus)
    ? (rawStatus as EventStatus)
    : EventStatus.UPCOMING;

  const rawVisibility = String(formData.get("visibility") ?? "PUBLIC").toUpperCase();
  const visibility = Object.values(EventVisibility).includes(rawVisibility as EventVisibility)
    ? (rawVisibility as EventVisibility)
    : EventVisibility.PUBLIC;

  const tags = parseTags(formData.getAll("tags").length > 0 ? formData.getAll("tags") : formData.get("tags"));
  const programs = parsePrograms(formData.getAll("programs").length > 0 ? formData.getAll("programs") : formData.get("programs"));

  let eventItems: EventItemInput[] = [];
  const eventItemsJson = formData.get("eventItems") as string;
  if (eventItemsJson) {
    try {
      eventItems = JSON.parse(eventItemsJson);
    } catch {
      throw new Error("Invalid event items format.");
    }
  }

  const action = String(formData.get("action") ?? "");
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
      startTime: parsedStart,
      endTime: parsedEnd,
      capacity,
      status,
      visibility,
      imageUrl: imageResult.imageUrl,
      tags,
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

export async function deleteEvent(formData: FormData): Promise<void> {
  await authorizeAdminUser();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Event ID is required for deletion.");

  const existingEvent = await prisma.event.findUnique({
    where: { id },
    select: { imageUrl: true },
  });

  await prisma.attendance.deleteMany({
    where: { rsvp: { eventId: id } },
  });

  await prisma.rSVP.deleteMany({
    where: { eventId: id },
  });

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

  await prisma.event.delete({
    where: { id },
  });

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

  redirect("/admin/events");
}