"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { putObjectToR2 } from "@/lib/r2";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function uploadResumeAction(formData: FormData) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return { success: false, error: "Profile not found" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "File exceeds 10MB limit" };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: "Only PDF, DOC, and DOCX files are allowed" };
    }

    // Generate storage key
    const fileExtension = file.name.split(".").pop();
    const storageKey = `resumes/${user.id}/${Date.now()}.${fileExtension}`;

    // Convert file to buffer and upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileUrl = await putObjectToR2(storageKey, buffer, file.type);

    if (!fileUrl) {
      return { success: false, error: "Failed to upload file to R2" };
    }

    // 1. Create the File record (using prisma.file & your schema's field names)
    const fileRecord = await prisma.file.create({
      data: {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,       // schema field is fileSize
        storageKey: storageKey,   // schema field is storageKey
        uploadedById: user.id,
      },
    });

    // 2. Attach the File ID to the User's Profile
    await prisma.profile.update({
      where: { id: user.profile.id },
      data: { resumeFileId: fileRecord.id },
    });

    revalidatePath("/profile");
    return { success: true, fileName: file.name };
  } catch (error) {
    console.error("Resume upload error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}