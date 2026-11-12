"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import { canManageApplications } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export async function manageApplicationArchive(ids: string[], action: string) {
  const user = await getAuthenticatedUser();
  if (!canManageApplications(user?.role)) throw new Error("Unauthorized action.");
  if (!Array.isArray(ids) || !ids.length || ids.some((id) => typeof id !== "string" || !id)) {
    throw new Error("Select applications first.");
  }
  if (action !== "archive" && action !== "restore") throw new Error("Invalid application action.");

  const uniqueIds = [...new Set(ids)];
  const isArchived = action === "restore";
  await prisma.$transaction(async (tx) => {
    const result = await tx.programApplication.updateMany({
      where: { id: { in: uniqueIds }, isArchived },
      data: { isArchived: !isArchived, visibleToUsers: false },
    });
    if (result.count !== uniqueIds.length) {
      throw new Error("Applications have changed. Refresh and try again.");
    }
  });

  revalidatePath("/admin/applications", "layout");
  revalidatePath("/applications");
}
