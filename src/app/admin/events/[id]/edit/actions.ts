"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ItemType } from "@prisma/client";
import { isAssignableProgram } from "@/lib/roles";

type EventItemInput = {
  name: string;
  type: ItemType;
};

export async function updateEvent(formData: FormData) {
  const id = formData.get("id") as string;
  
  // Extract submission action button value ("draft", "publish", "unpublish")
  const action = String(formData.get("action") ?? "");

  // Extract and parse form fields
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const startTimeInput = formData.get("startTime") as string; // e.g., "2026-08-22T09:48"
  const endTimeInput = formData.get("endTime") as string;

  // Helper to force interpretation of datetime-local as Central Time (America/Chicago)
  const parseCentralTime = (dateStr: string) => {
    if (!dateStr) return new Date();
    
    // Check if Daylight Saving Time is roughly active (March to November) 
    // or let's use a standard offset lookup. During CDT (Mar-Nov), it's -05:00. 
    // For absolute precision, we can append "-05:00" or handle it via a robust helper:
    const cleanDate = dateStr.replace("Z", "");
    
    // Temporary date to check month for DST (rough check or standard US Central offset)
    // Central Daylight Time (CDT) is UTC-5, Central Standard Time (CST) is UTC-6.
    const month = new Date(cleanDate).getMonth(); // 0-indexed (2 = March, 10 = November)
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

  // Programs the event counts toward for member status. Empty = general event.
  const programsString = formData.get("programs") as string;
  const programs = programsString
    ? programsString
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(isAssignableProgram)
    : [];

  // Extract and parse event items from the JSON hidden input
  const eventItemsJson = formData.get("eventItems") as string;
  const eventItems: EventItemInput[] = eventItemsJson ? JSON.parse(eventItemsJson) : [];

  // Determine isPublished state based on which button was clicked
  let isPublished: boolean;
  if (action === "publish") {
    isPublished = true;
  } else if (action === "unpublish") {
    isPublished = false;
  } else {
    // Fallback: keep whatever is currently stored in the database if generic "Save changes" was clicked
    const existing = await prisma.event.findUnique({
      where: { id },
      select: { isPublished: true },
    });
    isPublished = existing?.isPublished ?? false;
  }

  // Update the event and sync items
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
      tags: tags as any,
      programs,
      isPublished,
      
      items: {
        deleteMany: {}, // Clear out old items for this event
        create: eventItems.map((item) => ({
          name: item.name,
          type: item.type,
        })),
      },
    },
  });

  // Clear the cache for the admin events page so the updated data shows immediately
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}/edit`);
  revalidatePath(`/admin/events/${id}/scan`);
  
  // Redirect back to the events list
  redirect("/admin/events");
}

export async function deleteEvent(formData: FormData) {
  const id = formData.get("id") as string;
  
  if (!id) throw new Error("Event ID is required for deletion");

  // 1. Delete associated attendance records first
  await prisma.attendance.deleteMany({
    where: { rsvp: { eventId: id } },
  });

  // 2. Delete associated RSVPs
  await prisma.rSVP.deleteMany({
    where: { eventId: id },
  });

  // 3. Delete associated event items (and their scans if needed)
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

  // 4. Now safe to delete the event
  await prisma.event.delete({
    where: { id },
  });

  revalidatePath("/admin/events");
  redirect("/admin/events");
}