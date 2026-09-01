import { auth } from "@clerk/nextjs/server";
import { ProgramType } from "@prisma/client";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export interface Question {
  id: string;
  type: string;
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  mappedToProfileKey?: string | null;
}

async function getCurrentUser() {
  const session = await auth();

  if (!session.userId) {
    return {
      error: createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401),
    } as const;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: session.userId },
    select: { id: true },
  });

  if (!user) {
    return {
      error: createErrorResponse("User not found", "USER_NOT_FOUND", 404),
    } as const;
  }

  return { userId: user.id } as const;
}

function getPhase(openAt: Date, closeAt: Date, now: Date) {
  if (now < openAt) return "upcoming" as const;
  if (now > closeAt) return "closed" as const;
  return "open" as const;
}

function getEligibility(programType: ProgramType): string[] {
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
    default:
      return [];
  }
}

function parseQuestions(questionsJson: unknown): Question[] {
  if (!questionsJson) return [];

  let rawQuestions: unknown[] = [];

  try {
    const parsed =
      typeof questionsJson === "string"
        ? JSON.parse(questionsJson)
        : questionsJson;

    if (Array.isArray(parsed)) {
      rawQuestions = parsed;
    }
  } catch (e) {
    console.error("Failed to parse questions JSON:", e);
    return [];
  }

  return rawQuestions.map((q, index) => {
    const item = typeof q === "object" && q !== null ? q : {};
    return {
      ...(item as Record<string, unknown>),
      id: (item as { id?: string }).id || `q_${index}`,
    } as Question;
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if ("error" in currentUser) {
    return currentUser.error;
  }

  const { id } = await params;

  // Execute application lookup in parallel with draft and submission checks
  const [application, draft, submission] = await Promise.all([
    prisma.programApplication.findFirst({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        questionsJson: true,
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
    }),
    prisma.applicationDraft.findUnique({
      where: {
        applicationId_userId: {
          applicationId: id,
          userId: currentUser.userId,
        },
      },
      select: { stepIndex: true, isSubmitted: true },
    }),
    prisma.applicationSubmission.findFirst({
      where: { applicationId: id, userId: currentUser.userId },
      orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
      select: { status: true },
    }),
  ]);

  if (!application) {
    return createErrorResponse("Application not found", "NOT_FOUND", 404);
  }

  const questions = parseQuestions(application.questionsJson);

  return NextResponse.json({
    application: {
      ...application,
      phase: getPhase(application.openAt, application.closeAt, new Date()),
      eligibility: getEligibility(application.programType),
      questions,
    },
    draft: draft ?? null,
    submissionStatus: submission?.status ?? null,
  });
}