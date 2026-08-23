import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { getDownloadUrl } from "@/lib/r2";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const session = await auth();

  if (!session.userId) {
    return {
      error: createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401),
    } as const;
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkId: session.userId,
    },
    select: {
      id: true,
      profile: {
        select: {
          resumeFile: {
            select: {
              fileName: true,
              storageKey: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return {
      error: createErrorResponse("User not found", "USER_NOT_FOUND", 404),
    } as const;
  }

  return { user } as const;
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if ("error" in currentUser) {
    return currentUser.error;
  }

  const resumeFile = currentUser.user.profile?.resumeFile;

  if (!resumeFile) {
    return createErrorResponse("Resume not found", "NOT_FOUND", 404);
  }

  const downloadUrl = await getDownloadUrl(
    resumeFile.storageKey,
    3600,
    resumeFile.fileName,
  );

  return NextResponse.redirect(downloadUrl);
}
