"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ItemType, type MembershipType, type UserRole } from "@prisma/client";
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

/**
 * "AIM Mentorship only" is the one restricted-visibility option the event
 * form exposes — Executives/Directors/AIM mentors see it everywhere, every
 * other member doesn't see it at all. Unchecked keeps the existing default
 * (visible to every signed-in member, same as before these fields existed).
 */
function resolveEventVisibility(restrictedToAim: boolean): {
  visibilityRoles: UserRole[];
  visibilityMembership: MembershipType[];
} {
  return restrictedToAim
    ? { visibilityRoles: ["EXECUTIVE"], visibilityMembership: ["AIM_MENTOR", "AIM_MENTEE"] }
    : { visibilityRoles: ["MEMBER"], visibilityMembership: [] };
}

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
  const { visibilityRoles, visibilityMembership } = resolveEventVisibility(
    formData.get("restrictedToAim") === "true"
  );

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
      visibilityRoles,
      visibilityMembership,
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
  const { visibilityRoles, visibilityMembership } = resolveEventVisibility(
    formData.get("restrictedToAim") === "true"
  );

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
      visibilityRoles,
      visibilityMembership,
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