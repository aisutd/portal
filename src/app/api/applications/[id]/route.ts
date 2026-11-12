import { ProgramType } from "@prisma/client";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export interface Question {
  id: string;
  type: string;
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  mappedToProfileKey?: string | null;
}

async function getOptionalUserId() {
  const session = await auth();

  if (!session?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkId: session.userId,
    },
    select: {
      id: true,
    },
  });

  return user?.id ?? null;
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
  const userId = await getOptionalUserId();
  const { id } = await params;

  // 1. Fetch the application
  const application = await prisma.programApplication.findUnique({
    where: { id, isArchived: false },
    select: {
      id: true,
      title: true,
      description: true,
      link: true,
      questionsJson: true,
      eligibility: true,
      roles: true,
      requiredProfileFields: true,
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

  if (!application.visibleToUsers) {
    return createErrorResponse("Application not available", "NOT_FOUND", 404);
  }

  // 2. Conditionally fetch user draft & submission if authenticated
  let draft = null;
  let submission = null;

  if (userId) {
    [draft, submission] = await Promise.all([
      prisma.applicationDraft.findUnique({
        where: {
          applicationId_userId: {
            applicationId: id,
            userId,
          },
        },
        select: { stepIndex: true, isSubmitted: true },
      }),
      prisma.applicationSubmission.findFirst({
        where: { applicationId: id, userId },
        orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
        select: { id: true, status: true },
      }),
    ]);
  }

  // 3. Only parse and include questions if userId exists (authenticated session)
  const questions = userId ? parseQuestions(application.questionsJson) : [];
  const eligibilityList = (application.eligibility as string[]) ?? [];

  return NextResponse.json({
    application: {
      ...application,
      questionsJson: undefined, // Strip raw JSON string from public response
      eligibility:
        eligibilityList.length > 0
          ? application.eligibility
          : getEligibility(application.programType),
      roles: application.roles,
      phase: getPhase(application.openAt, application.closeAt, new Date()),
      questions,
      link: application.link,
    },
    draft: draft ?? null,
    submissionStatus: submission?.status ?? null,
    submissionId: submission?.id ?? null,
  });
}
