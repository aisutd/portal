"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EventStatus, EventTag, ItemType, MembershipType, TEAM, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { isAssignableProgram } from "@/lib/roles";
import { putObjectToR2, deleteObjectFromR2 } from "@/lib/r2";
import { extractStorageKeyFromUrl } from "@/lib/admin/event-form-parsing";
import { chicagoInputToUtc } from "@/lib/timezone";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

type EventItemInput = {
  name: string;
  type: ItemType;
};

const VALID_TAG_VALUES = Object.values(EventTag);
const VALID_ROLE_VALUES = Object.values(UserRole);
const VALID_TEAM_VALUES = Object.values(TEAM);
const ALLOWED_ADMIN_ROLES: UserRole[] = ["EXECUTIVE", "DIRECTOR", "OFFICER"];

function isImageFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
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
    .filter((tag): tag is EventTag => (VALID_TAG_VALUES as readonly string[]).includes(tag));
}

function parseUserRoles(rawValue: FormDataEntryValue | FormDataEntryValue[] | null): UserRole[] {
  if (!rawValue) return [];
  const entries = Array.isArray(rawValue) ? rawValue : [rawValue];

  return entries
    .flatMap((entry) => String(entry).split(","))
    .map((role) => role.trim().toUpperCase())
    .filter((role): role is UserRole => (VALID_ROLE_VALUES as readonly string[]).includes(role));
}

function parseTeams(rawValue: FormDataEntryValue | FormDataEntryValue[] | null): TEAM[] {
  if (!rawValue) return [];
  const entries = Array.isArray(rawValue) ? rawValue : [rawValue];

  return entries
    .flatMap((entry) => String(entry).split(","))
    .map((team) => team.trim().toUpperCase())
    .filter((team): team is TEAM => (VALID_TEAM_VALUES as readonly string[]).includes(team));
}

function authorizeAdminUser(user: { role: UserRole } | null) {
  if (!user) {
    redirect("/onboarding");
  } else if (!ALLOWED_ADMIN_ROLES.includes(user.role)) {
    throw new Error("Unauthorized action.");
  }
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
  const user = await getAuthenticatedUser();
  authorizeAdminUser(user);

  const id = formData.get("id") as string;
  if (!id) throw new Error("Event ID is required.");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  
  const startTimeInput = String(formData.get("startTime") ?? "");
  const endTimeInput = String(formData.get("endTime") ?? "");

  // Bulletproof CT string -> UTC Date conversion
  const parsedStart = chicagoInputToUtc(startTimeInput);
  const parsedEnd = chicagoInputToUtc(endTimeInput);

  if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime()) || parsedEnd <= parsedStart) {
    throw new Error("Please select a valid event window.");
  }

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

  const capacityStr = formData.get("capacity") as string;
  const parsedCapacity = capacityStr ? parseInt(capacityStr, 10) : null;
  const capacity = parsedCapacity && parsedCapacity > 0 ? parsedCapacity : null;

  const rawStatus = String(formData.get("status") ?? "UPCOMING").toUpperCase();
  const status = Object.values(EventStatus).includes(rawStatus as EventStatus)
    ? (rawStatus as EventStatus)
    : EventStatus.UPCOMING;

  const visibility = String(formData.get("visibility") ?? "PUBLIC").toUpperCase();

  const rawRsvpOpen = formData.get("isRsvpOpen");
  const isRsvpOpen = rawRsvpOpen === "true" || rawRsvpOpen === "on" || rawRsvpOpen === "1";

  // Parse Visibility Arrays
  const visibilityRoles = parseUserRoles(
    formData.getAll("visibilityRoles").length > 0 ? formData.getAll("visibilityRoles") : formData.get("visibilityRoles")
  );
  const visibilityMembership = parsePrograms(
    formData.getAll("visibilityMembership").length > 0 ? formData.getAll("visibilityMembership") : formData.get("visibilityMembership")
  );
  const visibilityTeams = parseTeams(
    formData.getAll("visibilityTeams").length > 0 ? formData.getAll("visibilityTeams") : formData.get("visibilityTeams")
  );

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
  const rawIsPublished = formData.get("isPublished");
  
  let isPublished: boolean;
  if (action === "publish") {
    isPublished = true;
  } else if (action === "unpublish") {
    isPublished = false;
  } else if (rawIsPublished !== null) {
    isPublished = rawIsPublished === "true" || rawIsPublished === "on" || rawIsPublished === "1";
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
      visibilityRoles,
      visibilityMembership,
      visibilityTeams,
      isRsvpOpen,
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
  const user = await getAuthenticatedUser();
  authorizeAdminUser(user);
  
  const id = formData.get("id") as string;
  if (!id) throw new Error("Event ID is required for deletion.");

  const existingEvent = await prisma.event.findUnique({
    where: { id },
    select: { imageUrl: true },
  });

  // 1. Delete RSVPs (RSVP does not cascade on Event deletion)
  await prisma.rSVP.deleteMany({
    where: { eventId: id },
  });

  // 2. Delete the Event
  await prisma.event.delete({
    where: { id },
  });

  // 3. Clean up image storage key from Cloudflare R2
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