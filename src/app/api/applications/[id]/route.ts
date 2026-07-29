import { auth } from "@clerk/nextjs/server";
import { ProgramType } from "@prisma/client";
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

function getEligibility(programType: ProgramType) {
  switch (programType) {
    case ProgramType.AI_ACADEMY:
      return [
        "Open to UTD students who want to learn AI and machine learning fundamentals.",
        "No prior experience is required.",
      ];
    case ProgramType.AI_INNOVATION:
      return [
        "Open to UTD students who want to build AI projects in a collaborative setting.",
        "Some technical or project experience is helpful, but not required.",
      ];
    case ProgramType.AI_MENTORSHIP_MENTOR:
      return [
        "Open to students with prior project or technical experience.",
        "Applicants should be ready to mentor and support younger students.",
      ];
    case ProgramType.AI_MENTORSHIP_MENTEE:
      return [
        "Open to students who want guidance while building AI skills or projects.",
        "Applicants should be ready to participate consistently throughout the program.",
      ];
  }
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/applications/[id]">
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

  if (!application) {
    return createErrorResponse("Application not found", "NOT_FOUND", 404);
  }

  const [draft, submission] = await Promise.all([
    prisma.applicationDraft.findUnique({
      where: {
        applicationId_userId: {
          applicationId: id,
          userId: currentUser.userId,
        },
      },
      select: {
        stepIndex: true,
        isSubmitted: true,
      },
    }),
    prisma.applicationSubmission.findFirst({
      where: {
        applicationId: id,
        userId: currentUser.userId,
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
        status: true,
      },
    }),
  ]);

  return NextResponse.json({
    application: {
      ...application,
      phase: getPhase(application.openAt, application.closeAt, new Date()),
      eligibility: getEligibility(application.programType),
    },
    draft: draft ?? null,
    submissionStatus: submission?.status ?? null,
  });
}
