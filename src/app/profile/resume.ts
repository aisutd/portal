"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { putObjectToR2, deleteObjectFromR2 } from "@/lib/r2";
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
      include: {
        profile: {
          include: {
            resumeFile: true, // Fetch existing resume file record
          },
        },
      },
    });

    if (!user || !user.profile) {
      return { success: false, error: "Profile not found" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "File exceeds 1MB limit" };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: "Only PDF, DOC, and DOCX files are allowed" };
    }

    // Capture the existing resume file record to clean it up after the new upload succeeds
    const oldResumeFile = user.profile.resumeFile;

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

    // 1. Create the new File record in Prisma
    const fileRecord = await prisma.file.create({
      data: {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storageKey: storageKey,
        uploadedById: user.id,
      },
    });

    // 2. Attach the new File ID to the User's Profile
    await prisma.profile.update({
      where: { id: user.profile.id },
      data: { resumeFileId: fileRecord.id },
    });

    // 3. Cleanup: Delete the old file from Cloudflare R2 and Prisma
    if (oldResumeFile) {
      if (oldResumeFile.storageKey) {
        await deleteObjectFromR2(oldResumeFile.storageKey);
      }
      await prisma.file.delete({
        where: { id: oldResumeFile.id },
      }).catch((err) => console.error("Failed to delete old file record from DB:", err));
    }

    revalidatePath("/profile");
    return { success: true, fileName: file.name };
  } catch (error) {
    console.error("Resume upload error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}