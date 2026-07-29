import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
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
    },
  });

  if (!user) {
    return {
      error: createErrorResponse("User not found", "USER_NOT_FOUND", 404),
    } as const;
  }

  return { userId: user.id } as const;
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ submissionId: string }> }
) {
  const currentUser = await getCurrentUser();
  if ("error" in currentUser) {
    return currentUser.error;
  }

  const { submissionId } = await ctx.params;

  const submission = await prisma.applicationSubmission.findFirst({
    where: {
      id: submissionId,
      userId: currentUser.userId,
    },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      formPayloadJson: true,
      application: {
        select: {
          title: true,
          retentionUntil: true,
        },
      },
    },
  });

  if (!submission) {
    return createErrorResponse("Submission not found", "NOT_FOUND", 404);
  }

  return NextResponse.json({
    submission,
  });
}
