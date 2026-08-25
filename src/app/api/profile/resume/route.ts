import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();

  if (!session.userId) {
    return createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: session.userId },
  });

  if (!user) {
    return createErrorResponse("User not found", "USER_NOT_FOUND", 404);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return createErrorResponse("No file provided", "INVALID_INPUT", 400);
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return createErrorResponse("File size exceeds 10MB limit", "FILE_TOO_LARGE", 400);
    }

    // Create File record in database
    const fileRecord = await prisma.file.create({
      data: {
        uploadedById: user.id,
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        fileSize: file.size,
        storageKey: `resumes/${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      },
    });

    // Update Profile with resumeFileId
    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        resumeFileId: fileRecord.id,
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        fileName: fileRecord.fileName,
      },
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return createErrorResponse("Failed to upload resume", "UPLOAD_FAILED", 500);
  }
}
