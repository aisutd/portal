"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ItemType } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseChicagoTimeToUtc,
  parsePrograms,
  parseStatus,
  parseTags,
  resolveEventImageUrl,
} from "@/lib/admin/event-form-parsing";

type EventItemInput = {
  name: string;
  type: ItemType;
};

const ALLOWED_ROLES = ["EXECUTIVE", "DIRECTOR", "OFFICER"];

function authorizeAdminUser(user: { role: string } | null) {
  if (!user) {
    redirect("/onboarding");
  } else if (!ALLOWED_ROLES.includes(user.role)) {
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
  const rawRsvpOpen = formData.get("isRsvpOpen");
  const isRsvpOpen = rawRsvpOpen === "true" || rawRsvpOpen === "on" || rawRsvpOpen === "1";
  
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
      isRsvpOpen,
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
    select: { imageUrl: true, isPublished: true, isArchived: true },
  });

  if (!existingEvent) {
    throw new Error("Event not found.");
  }

  if (existingEvent.isArchived) throw new Error("Restore this event before editing it.");
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