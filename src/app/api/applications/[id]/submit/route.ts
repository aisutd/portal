import { auth } from "@clerk/nextjs/server";
import { ApplicationStatus, Prisma } from "@prisma/client";
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

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if ("error" in currentUser) {
    return currentUser.error;
  }

  const { id } = await ctx.params;

  const application = await prisma.programApplication.findFirst({
    where: {
      id,
      visibleToUsers: true,
    },
    select: {
      id: true,
    },
  });

  if (!application) {
    return createErrorResponse("Application not found", "NOT_FOUND", 404);
  }

  const result = await prisma.$transaction(async (tx) => {
    const draft = await tx.applicationDraft.findUnique({
      where: {
        applicationId_userId: {
          applicationId: id,
          userId: currentUser.userId,
        },
      },
      select: {
        formPayloadJson: true,
        isSubmitted: true,
      },
    });

    if (!draft) {
      return { error: createErrorResponse("Draft not found", "BAD_REQUEST", 400) } as const;
    }

    const latestSubmission = await tx.applicationSubmission.findFirst({
      where: {
        applicationId: id,
        userId: currentUser.userId,
      },
      orderBy: {
        versionNumber: "desc",
      },
      select: {
        versionNumber: true,
      },
    });

    const versionNumber = latestSubmission ? latestSubmission.versionNumber + 1 : 1;
    const normalizedFormPayloadJson =
      draft.formPayloadJson === null
        ? Prisma.JsonNull
        : (draft.formPayloadJson as Prisma.InputJsonValue);

    const submission = await tx.applicationSubmission.create({
      data: {
        applicationId: id,
        userId: currentUser.userId,
        versionNumber,
        formPayloadJson: normalizedFormPayloadJson,
        status: ApplicationStatus.SUBMITTED,
      },
      select: {
        id: true,
        versionNumber: true,
        status: true,
        submittedAt: true,
      },
    });

    await tx.applicationDraft.update({
      where: {
        applicationId_userId: {
          applicationId: id,
          userId: currentUser.userId,
        },
      },
      data: {
        isSubmitted: true,
      },
    });

    return { submission } as const;
  });

  if ("error" in result) {
    return result.error;
  }

  return NextResponse.json({
    submission: result.submission,
  });
}
