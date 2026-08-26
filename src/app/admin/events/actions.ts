"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EventStatus, EventTag, ItemType, type MembershipType } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAssignableProgram } from "@/lib/roles";
import { putObjectToR2 } from "@/lib/r2";

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

function parseChicagoTimeToUtc(localDateTimeString: string): Date {
  if (!localDateTimeString) return new Date(NaN);

  const targetDate = new Date(`${localDateTimeString}:00Z`);
  if (isNaN(targetDate.getTime())) return new Date(NaN);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    timeZoneName: "shortOffset",
  });

  const parts = formatter.formatToParts(targetDate);
  const timeZoneName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";

  const match = timeZoneName.match(/GMT([+-]\d+)/);
  if (!match) return new Date(`${localDateTimeString}:00-05:00`);

  // Fixed string padding bug: parse offset integer directly
  const hours = parseInt(match[1], 10);
  const sign = hours >= 0 ? "+" : "-";
  const padHours = Math.abs(hours).toString().padStart(2, "0");
  const offset = `${sign}${padHours}:00`;

  return new Date(`${localDateTimeString}:00${offset}`);
}

/** Handles both single entry strings and array form values */
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
    .filter((tag): tag is EventTag =>
      (validTagValues as readonly string[]).includes(tag)
    );
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

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Event cover image must be under 2 MB.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `events/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const data = Buffer.from(await file.arrayBuffer());

  const publicUrl = await putObjectToR2(key, data, file.type || "image/jpeg");

  if (!publicUrl) {
    throw new Error(
      "Failed to upload image to R2. Please check server logs for R2 configuration errors."
    );
  }

  return publicUrl;
}

function authorizeAdminUser(user: { role: string } | null) {
  if (!user) {
    redirect("/onboarding");
  }
  else if (user.role !== "EXECUTIVE" && user.role !== "OFFICER") {
    throw new Error("Unauthorized action.");
  }
}

export async function createEvent(formData: FormData) {
  const currentUser = await getAuthenticatedUser();
  authorizeAdminUser(currentUser);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const capacityValue = formData.get("capacity");
  const visibility = String(formData.get("visibility") ?? "public").trim() || "public";
  
  const tags = parseTags(formData.getAll("tags").length > 0 ? formData.getAll("tags") : formData.get("tags"));
  const programs = parsePrograms(formData.getAll("programs").length > 0 ? formData.getAll("programs") : formData.get("programs"));
  const status = parseStatus(formData.get("status"));
  const imageUrl = await resolveEventImageUrl(formData.get("image"));
  
  const action = String(formData.get("action") ?? "draft");
  const isPublished = action === "publish";

  let eventItems: EventItemInput[] = [];
  try {
    const rawJson = formData.get("eventItems") as string;
    eventItems = rawJson ? JSON.parse(rawJson) : [];
  } catch {
    throw new Error("Invalid format for event items.");
  }

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
      isPublished,
      createdById: currentUser!.id,

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
  authorizeAdminUser(currentUser);

  const id = formData.get("id") as string;
  if (!id) throw new Error("Event ID is missing.");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const capacityValue = formData.get("capacity");
  const visibility = String(formData.get("visibility") ?? "public").trim() || "public";
  
  const tags = parseTags(formData.getAll("tags").length > 0 ? formData.getAll("tags") : formData.get("tags"));
  const programs = parsePrograms(formData.getAll("programs").length > 0 ? formData.getAll("programs") : formData.get("programs"));
  const status = parseStatus(formData.get("status"));

  // Consolidated database fetch into a single query
  const existingEvent = await prisma.event.findUnique({
    where: { id },
    select: { imageUrl: true, isPublished: true },
  });

  if (!existingEvent) {
    throw new Error("Event not found.");
  }

  const imageUrl = await resolveEventImageUrl(formData.get("image"), existingEvent.imageUrl);

  const action = String(formData.get("action") ?? "");

  let eventItems: EventItemInput[] = [];
  try {
    const rawJson = formData.get("eventItems") as string;
    eventItems = rawJson ? JSON.parse(rawJson) : [];
  } catch {
    throw new Error("Invalid format for event items.");
  }

  if (!title || !description || !location || !startTime || !endTime) {
    throw new Error("Please fill out all required fields.");
  }

  const parsedStart = parseChicagoTimeToUtc(String(startTime));
  const parsedEnd = parseChicagoTimeToUtc(String(endTime));

  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime()) || parsedEnd <= parsedStart) {
    throw new Error("Please choose a valid event window.");
  }

  const capacity = Number(capacityValue ?? 0);

  let isPublished: boolean;
  if (action === "publish") {
    isPublished = true;
  } else if (action === "unpublish") {
    isPublished = false;
  } else {
    isPublished = existingEvent.isPublished;
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