"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ItemType } from "@prisma/client";

type EventItemInput = {
  name: string;
  type: ItemType;
};

export async function updateEvent(formData: FormData) {
  const id = formData.get("id") as string;
  
  // Extract and parse form fields
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const startTime = new Date(formData.get("startTime") as string);
  const endTime = new Date(formData.get("endTime") as string);
  
  const capacityStr = formData.get("capacity") as string;
  const capacity = capacityStr ? parseInt(capacityStr, 10) : null;
  
  const status = formData.get("status") as string;
  const visibility = formData.get("visibility") as string;
  
  // Tags come through as a comma-separated string from the hidden input
  const tagsString = formData.get("tags") as string;
  const tags = tagsString ? tagsString.split(",").filter(Boolean) : [];

  // Extract and parse event items from the JSON hidden input
  const eventItemsJson = formData.get("eventItems") as string;
  const eventItems: EventItemInput[] = eventItemsJson ? JSON.parse(eventItemsJson) : [];

  // Update the event and sync items in a single transaction or clean update flow
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
      
      // Sync items: Delete existing ones and recreate the updated set, 
      // or use nested writes. Deleting and recreating is the cleanest way to handle form arrays.
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