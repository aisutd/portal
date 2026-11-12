import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { getApplicationReviewer, postingOutOfScopeResponse } from "@/lib/admin-app-auth";
import { canManageApplications, canReviewProgramType } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  // Reviewers, not just admins: an AIM mentor reaches this with role MEMBER.
  // Status changes stay Director/Executive-only, enforced below.
  const currentUser = await getApplicationReviewer();
  if ("error" in currentUser) return currentUser.error;

  const { submissionId } = await params;

  try {
    const { status, notes } = (await request.json()) as {
      status?: ApplicationStatus;
      notes?: string;
    };

    const currentSubmission = await prisma.applicationSubmission.findUnique({
      where: { id: submissionId },
      select: {
        status: true,
        application: { select: { programType: true, isArchived: true } },
      },
    });

    if (!currentSubmission) {
      return createErrorResponse("Submission not found", "NOT_FOUND", 404);
    }

    if (
      (currentSubmission.application.isArchived && !canManageApplications(currentUser.user.role)) ||
      !canReviewProgramType(
        currentUser.allowedProgramTypes,
        currentSubmission.application.programType
      )
    ) {
      return postingOutOfScopeResponse();
    }

    if (currentSubmission.application.isArchived) {
      return createErrorResponse("Restore this application before reviewing it.", "CONFLICT", 409);
    }

    if (status) {
      const userRole = currentUser.user.role; // MEMBER | OFFICER | DIRECTOR | EXECUTIVE
      const isAllowedToChangeStatus = userRole === "DIRECTOR" || userRole === "EXECUTIVE";

      if (!isAllowedToChangeStatus) {
        return createErrorResponse(
          "Forbidden: Only Directors and Executives can modify application status.",
          "FORBIDDEN",
          403
        );
      }

      await prisma.applicationSubmission.update({
        where: { id: submissionId },
        data: { status },
      });
    }

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update submission:", error);
    return createErrorResponse("Failed to update submission", "INTERNAL_SERVER_ERROR", 500);
  }
}
