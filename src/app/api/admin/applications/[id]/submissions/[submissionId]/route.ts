import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { getAdminUser } from "@/lib/admin-app-auth";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  const currentUser = await getAdminUser();
  if ("error" in currentUser) return currentUser.error;

  const { submissionId } = await params;

  try {
    const { status, notes } = (await request.json()) as {
      status?: ApplicationStatus;
      notes?: string;
    };

    // 1. Fetch current submission status if needed for default review status
    const currentSubmission = await prisma.applicationSubmission.findUnique({
      where: { id: submissionId },
      select: { status: true },
    });

    if (!currentSubmission) {
      return createErrorResponse("Submission not found", "NOT_FOUND", 404);
    }

    // 2. Update overall submission status if provided
    if (status) {
      await prisma.applicationSubmission.update({
        where: { id: submissionId },
        data: { status },
      });
    }

    // 3. Upsert reviewer notes safely satisfying Prisma constraints
    if (notes !== undefined) {
      const reviewStatus = status || currentSubmission.status || ApplicationStatus.IN_REVIEW;

      await prisma.applicationReview.upsert({
        where: {
          submissionId_reviewerId: {
            submissionId,
            reviewerId: currentUser.user.id,
          },
        },
        update: {
          notesInternal: notes,
          ...(status ? { status } : {}),
        },
        create: {
          submissionId,
          reviewerId: currentUser.user.id,
          notesInternal: notes,
          status: reviewStatus, // Required field on ApplicationReview model
        },
      });
    }

    if (status) {
      const userRole = currentUser.user.role; // Matches UserRole enum: MEMBER | OFFICER | DIRECTOR | EXECUTIVE
      const isAllowedToChangeStatus = userRole === "DIRECTOR" || userRole === "EXECUTIVE";

      if (!isAllowedToChangeStatus) {
        return createErrorResponse(
          "Forbidden: Only Directors and Executives can modify application status.",
          "FORBIDDEN",
          403
        );
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update submission:", error);
    return createErrorResponse("Failed to update submission", "INTERNAL_SERVER_ERROR", 500);
  }
}