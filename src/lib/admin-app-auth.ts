import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse } from "@/lib/api-error";
import { isAdminRole } from "@/lib/roles";

export async function getAdminUser() {
  const session = await auth();
  if (!session.userId) {
    return { error: createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401) } as const;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: session.userId },
    select: { id: true, role: true },
  });

  if (!user || !isAdminRole(user.role)) {
    return { error: createErrorResponse("Forbidden", "FORBIDDEN", 403) } as const;
  }

  return { user } as const;
}
