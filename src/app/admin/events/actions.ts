"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EventStatus, EventTag, ItemType, type MembershipType } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAssignableProgram } from "@/lib/roles";
import { putObjectToR2 } from "@/lib/r2";
import { parseChicagoTimeToUtc } from "@/lib/time";

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

// parseChicagoTimeToUtc has been centralized into src/lib/time.ts
// see parseChicagoTimeToUtc in that module for the robust implementation.


/** Programs an event counts toward. Empty means it counts for everyone. */
function parsePrograms(rawValue: FormDataEntryValue | null): MembershipType[] {
  if (!rawValue) {
    return [];
  }

  return String(rawValue)
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(isAssignableProgram);
}

function parseTags(rawValue: FormDataEntryValue | null): EventTag[] {
  if (!rawValue) {
    return [];
  }

  return String(rawValue)
    .split(",")
    .map((tag) => tag.trim().toUpperCase())
    .filter((tag): tag is EventTag =>
      (validTagValues as readonly string[]).includes(tag)
    ) as EventTag[];
}

function parseStatus(rawValue: FormDataEntryValue | null): EventStatus {
  const value = String(rawValue ?? "UPCOMING").trim().toUpperCase();

  switch (value) {
    case "LIVE":
      return EventStatus.LIVE;
    case "CLOSED":
      return EventStatus.CLOSED;
    case "ARCHIVED":
      return EventStatus.ARCHIVED;
    default:
      return EventStatus.UPCOMING;
  }
}

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

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `events/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const data = Buffer.from(await file.arrayBuffer());

  // Upload directly to Cloudflare R2
  const publicUrl = await putObjectToR2(key, data, file.type || "image/jpeg");

  if (!publicUrl) {
    throw new Error(
      "Failed to upload image to R2. Please check server logs for R2 configuration errors."
    );
  }

  return publicUrl;
}

export async function createEvent(formData: FormData) {
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const capacityValue = formData.get("capacity");
  const visibility = String(formData.get("visibility") ?? "public").trim() || "public";
  const tags = parseTags(formData.get("tags"));
  const programs = parsePrograms(formData.get("programs"));
  const status = parseStatus(formData.get("status"));
  const imageUrl = await resolveEventImageUrl(formData.get("image"));
  
  // Read submission action button value ("publish" vs "draft")
  const action = String(formData.get("action") ?? "draft");
  const isPublished = action === "publish";

  // Extract and parse event items from the JSON hidden input
  const eventItemsJson = formData.get("eventItems") as string;
  const eventItems: EventItemInput[] = eventItemsJson ? JSON.parse(eventItemsJson) : [];

  if (!title || !description || !location || !startTime || !endTime) {
    throw new Error("Please fill out the event title, description, location, and schedule.");
  }

  const parsedStart = parseChicagoTimeToUtc(String(startTime));
  const parsedEnd = parseChicagoTimeToUtc(String(endTime));

  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime()) || parsedEnd <= parsedStart) {
    throw new Error("Please choose a valid event window.");
  }

  const capacity = Number(capacityValue ?? 0);

  await prisma.event.create({
    data: {
      title,
      description,
      location,
      startTime: parsedStart,
      endTime: parsedEnd,
      status,
      capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
      visibility,
      imageUrl,
      tags,
      programs,
      isPublished, // Properly saved as true or false
      createdById: currentUser.id,

      items: {
        create: eventItems.map((item) => ({
          name: item.name,
          type: item.type,
        })),
      },
    },
  });

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateEvent(formData: FormData) {
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const id = formData.get("id") as string;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const capacityValue = formData.get("capacity");
  const visibility = String(formData.get("visibility") ?? "public").trim() || "public";
  const tags = parseTags(formData.get("tags"));
  const programs = parsePrograms(formData.get("programs"));
  const status = parseStatus(formData.get("status"));

  const existingEvent = await prisma.event.findUnique({
    where: { id },
    select: { imageUrl: true },
  });
  const imageUrl = await resolveEventImageUrl(formData.get("image"), existingEvent?.imageUrl ?? null);

  // Read action type from edit button ("publish", "unpublish", or default to current database state)
  const action = String(formData.get("action") ?? "");
  
  // Extract and parse event items from the JSON hidden input
  const eventItemsJson = formData.get("eventItems") as string;
  const eventItems: EventItemInput[] = eventItemsJson ? JSON.parse(eventItemsJson) : [];

  if (!id || !title || !description || !location || !startTime || !endTime) {
    throw new Error("Please fill out all required fields.");
  }

  const parsedStart = parseChicagoTimeToUtc(String(startTime));
  const parsedEnd = parseChicagoTimeToUtc(String(endTime));

  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime()) || parsedEnd <= parsedStart) {
    throw new Error("Please choose a valid event window.");
  }

  const capacity = Number(capacityValue ?? 0);

  // Determine isPublished: 
  // If "publish" was clicked -> true, if "unpublish" -> false, otherwise fetch/keep existing value
  let isPublished: boolean;
  if (action === "publish") {
    isPublished = true;
  } else if (action === "unpublish") {
    isPublished = false;
  } else {
    // Fallback: fetch current state if generic save was submitted without publish/unpublish buttons
    const existing = await prisma.event.findUnique({ where: { id }, select: { isPublished: true } });
    isPublished = existing?.isPublished ?? false;
  }

  await prisma.event.update({
    where: { id },
    data: {
      title,
      description,
      location,
      startTime: parsedStart,
      endTime: parsedEnd,
      status,
      capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
      visibility,
      imageUrl,
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