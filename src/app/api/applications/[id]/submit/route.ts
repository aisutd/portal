import { auth } from "@clerk/nextjs/server";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import {
  buildFormLayout,
  extractStringValues,
  toFieldValues,
  validateFields,
} from "@/lib/application-form";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const session = await auth();
  if (!session.userId) {
    return { error: createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401) } as const;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: session.userId },
    select: { id: true },
  });

  if (!user) {
    return { error: createErrorResponse("User not found", "USER_NOT_FOUND", 404) } as const;
  }

  return { userId: user.id } as const;
}

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if ("error" in currentUser) return currentUser.error;

  const { id } = await ctx.params;
  const now = new Date();

  const application = await prisma.programApplication.findFirst({
    where: { id },
    select: {
      id: true,
      questionsJson: true,
      openAt: true,
      closeAt: true,
    },
  });

  if (!application) {
    return createErrorResponse("Application not found", "NOT_FOUND", 404);
  }

  // Validate application window constraints
  if (now < application.openAt) {
    return createErrorResponse("Application window is not open yet.", "BAD_REQUEST", 400);
  }
  if (now > application.closeAt) {
    return createErrorResponse("Application window has closed.", "BAD_REQUEST", 400);
  }

  const layout = buildFormLayout(application.questionsJson);

  const result = await prisma.$transaction(async (tx) => {
    const [draft, latestSubmission] = await Promise.all([
      tx.applicationDraft.findUnique({
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
      }),
      tx.applicationSubmission.findFirst({
        where: {
          applicationId: id,
          userId: currentUser.userId,
        },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      }),
    ]);

    if (latestSubmission || draft?.isSubmitted) {
      return {
        error: createErrorResponse("Application already submitted", "ALREADY_SUBMITTED", 409),
      } as const;
    }

    if (!draft) {
      return { error: createErrorResponse("Draft not found", "BAD_REQUEST", 400) } as const;
    }

    const answers = toFieldValues(
      layout.allFieldLabels,
      extractStringValues(layout.allFieldLabels, draft.formPayloadJson)
    );
    const fieldErrors = validateFields(answers, layout.allFieldLabels);

    if (Object.keys(fieldErrors).length > 0) {
      return {
        error: createErrorResponse(
          "Some answers are missing or incorrectly formatted.",
          "INVALID_APPLICATION",
          400,
          { fields: fieldErrors }
        ),
      } as const;
    }

    const normalizedFormPayloadJson =
      draft.formPayloadJson === null
        ? Prisma.JsonNull
        : (draft.formPayloadJson as Prisma.InputJsonValue);

    const submission = await tx.applicationSubmission.create({
      data: {
        applicationId: id,
        userId: currentUser.userId,
        versionNumber: 1,
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

    await tx.applicationDraft.delete({
      where: {
        applicationId_userId: {
          applicationId: id,
          userId: currentUser.userId,
        },
      },
    });

    return { submission } as const;
  });

  if ("error" in result) {
    return result.error;
  }

  return NextResponse.json({ submission: result.submission });
}