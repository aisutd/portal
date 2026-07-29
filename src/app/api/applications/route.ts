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

function getPhase(openAt: Date, closeAt: Date, now: Date) {
  if (now < openAt) {
    return "upcoming" as const;
  }

  if (now > closeAt) {
    return "closed" as const;
  }

  return "open" as const;
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if ("error" in currentUser) {
    return currentUser.error;
  }

  const now = new Date();

  const applications = await prisma.programApplication.findMany({
    where: {
      visibleToUsers: true,
    },
    orderBy: {
      openAt: "asc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      programType: true,
      openAt: true,
      closeAt: true,
      decisionDate: true,
      visibleToUsers: true,
      retentionUntil: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const applicationIds = applications.map((application) => application.id);

  const [drafts, submissions] = await Promise.all([
    prisma.applicationDraft.findMany({
      where: {
        userId: currentUser.userId,
        applicationId: {
          in: applicationIds,
        },
      },
      select: {
        applicationId: true,
        stepIndex: true,
        isSubmitted: true,
      },
    }),
    prisma.applicationSubmission.findMany({
      where: {
        userId: currentUser.userId,
        applicationId: {
          in: applicationIds,
        },
      },
      orderBy: [
        {
          submittedAt: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
      select: {
        applicationId: true,
        status: true,
      },
    }),
  ]);

  const draftByApplicationId = new Map(
    drafts.map((draft) => [
      draft.applicationId,
      {
        stepIndex: draft.stepIndex,
        isSubmitted: draft.isSubmitted,
      },
    ])
  );

  const submissionByApplicationId = new Map<
    string,
    {
      status: (typeof submissions)[number]["status"];
    }
  >();

  for (const submission of submissions) {
    if (!submissionByApplicationId.has(submission.applicationId)) {
      submissionByApplicationId.set(submission.applicationId, {
        status: submission.status,
      });
    }
  }

  return NextResponse.json({
    applications: applications.map((application) => ({
      ...application,
      phase: getPhase(application.openAt, application.closeAt, now),
      draft: draftByApplicationId.get(application.id) ?? null,
      submissionStatus: submissionByApplicationId.get(application.id)?.status ?? null,
    })),
  });
}
