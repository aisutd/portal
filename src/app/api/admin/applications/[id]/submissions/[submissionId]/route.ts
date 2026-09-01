import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { getAdminUser } from "@/lib/admin-app-auth";
import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  const currentUser = await getAdminUser();
  if ("error" in currentUser) return currentUser.error;

  const { submissionId } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    notes?: string;
    status?: ApplicationStatus;
  };

  const submission = await prisma.applicationSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return createErrorResponse("Submission not found", "NOT_FOUND", 404);
  }

  const hasNotes = Boolean(body.notes && body.notes.trim().length > 0);
  const autoInReview = hasNotes && !body.status && submission.status === "SUBMITTED";
  const targetStatus = body.status ?? (autoInReview ? "IN_REVIEW" : submission.status);

  // Update submission status if provided or auto-moved to IN_REVIEW
  if (body.status || autoInReview) {
    await prisma.applicationSubmission.update({
      where: { id: submissionId },
      data: { status: targetStatus },
    });
  }

  // Upsert reviewer's ApplicationReview record in the database
  const review = await prisma.applicationReview.upsert({
    where: {
      submissionId_reviewerId: {
        submissionId,
        reviewerId: currentUser.user.id,
      },
    },
    update: {
      status: targetStatus,
      notesInternal: body.notes ?? undefined,
    },
    create: {
      submissionId,
      reviewerId: currentUser.user.id,
      status: targetStatus,
      notesInternal: body.notes ?? undefined,
    },
  });

  return NextResponse.json({ success: true, review });
}
