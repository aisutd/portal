import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { getAdminUser } from "@/lib/admin-app-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  const currentUser = await getAdminUser();
  if ("error" in currentUser) return currentUser.error;

  const { submissionId } = await params;
  const submission = await prisma.applicationSubmission.findUnique({
    where: { id: submissionId },
    include: {
      user: {
        include: {
          profile: {
            include: {
              resumeFile: true,
            },
          },
        },
      },
    },
  });

  const resumeFile = submission?.user.profile?.resumeFile;
  if (!resumeFile) {
    return createErrorResponse("Resume file not found", "NOT_FOUND", 404);
  }

  // Redirect to storage/R2 URL or proxy file
  const storageUrl = `/api/files/${resumeFile.id}`;
  return NextResponse.redirect(new URL(storageUrl, _request.url));
}
