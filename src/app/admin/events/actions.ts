"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ItemType, MembershipType, TEAM, UserRole } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAssignableProgram } from "@/lib/roles";
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

const VALID_ROLE_VALUES = Object.values(UserRole);
const VALID_TEAM_VALUES = Object.values(TEAM);
const ALLOWED_ROLES: UserRole[] = ["EXECUTIVE", "DIRECTOR", "OFFICER"];

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

function parseMemberships(rawValue: FormDataEntryValue | FormDataEntryValue[] | null): MembershipType[] {
  if (!rawValue) return [];
  const entries = Array.isArray(rawValue) ? rawValue : [rawValue];

  return entries
    .flatMap((entry) => String(entry).split(","))
    .map((value) => value.trim().toUpperCase())
    .filter(isAssignableProgram);
}

function authorizeAdminUser(user: { role: UserRole } | null) {
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

  // Parsing Visibility Arrays
  const visibilityRoles = parseUserRoles(
    formData.getAll("visibilityRoles").length > 0 ? formData.getAll("visibilityRoles") : formData.get("visibilityRoles")
  );
  const visibilityMembership = parseMemberships(
    formData.getAll("visibilityMembership").length > 0 ? formData.getAll("visibilityMembership") : formData.get("visibilityMembership")
  );
  const visibilityTeams = parseTeams(
    formData.getAll("visibilityTeams").length > 0 ? formData.getAll("visibilityTeams") : formData.get("visibilityTeams")
  );

  const tags = parseTags(formData.getAll("tags").length > 0 ? formData.getAll("tags") : formData.get("tags"));
  const programs = parsePrograms(formData.getAll("programs").length > 0 ? formData.getAll("programs") : formData.get("programs"));
  const status = parseStatus(formData.get("status"));
  const imageUrl = await resolveEventImageUrl(formData.get("image"));

  const action = String(formData.get("action") ?? "");
  const rawIsPublished = formData.get("isPublished");
  const isPublished =
    action === "publish" || rawIsPublished === "true" || rawIsPublished === "on" || rawIsPublished === "1";

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
      visibilityTeams,
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
  const rawRsvpOpen = formData.get("isRsvpOpen");
  const isRsvpOpen = rawRsvpOpen === "true" || rawRsvpOpen === "on" || rawRsvpOpen === "1";

  // Parsing Visibility Arrays
  const visibilityRoles = parseUserRoles(
    formData.getAll("visibilityRoles").length > 0 ? formData.getAll("visibilityRoles") : formData.get("visibilityRoles")
  );
  const visibilityMembership = parseMemberships(
    formData.getAll("visibilityMembership").length > 0 ? formData.getAll("visibilityMembership") : formData.get("visibilityMembership")
  );
  const visibilityTeams = parseTeams(
    formData.getAll("visibilityTeams").length > 0 ? formData.getAll("visibilityTeams") : formData.get("visibilityTeams")
  );

  const tags = parseTags(formData.getAll("tags").length > 0 ? formData.getAll("tags") : formData.get("tags"));
  const programs = parsePrograms(formData.getAll("programs").length > 0 ? formData.getAll("programs") : formData.get("programs"));
  const status = parseStatus(formData.get("status"));

  const existingEvent = await prisma.event.findUnique({
    where: { id },
    select: { imageUrl: true, isPublished: true },
  });

  if (!existingEvent) {
    throw new Error("Event not found.");
  }

  const imageUrl = await resolveEventImageUrl(formData.get("image"), existingEvent.imageUrl);

  const action = String(formData.get("action") ?? "");
  const rawIsPublished = formData.get("isPublished");

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
  } else if (rawIsPublished !== null) {
    isPublished = rawIsPublished === "true" || rawIsPublished === "on" || rawIsPublished === "1";
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
      visibilityTeams,
      isRsvpOpen,
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