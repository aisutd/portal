import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const session = await auth();

  if (!session.userId) {
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
  if (now < openAt) {
    return "upcoming" as const;
  }

  if (now > closeAt) {
    return "closed" as const;
  }

  return "open" as const;
}

export async function GET() {
  const userId = await getCurrentUser();

  const now = new Date();
  const retentionWindowMs = 14 * 24 * 60 * 60 * 1000;

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

  const applicationsWithPhase = applications.map((application) => ({
    ...application,
    phase: getPhase(application.openAt, application.closeAt, now),
  }));

  const visibleApplications = applicationsWithPhase.filter((application) => {
    if (application.phase !== "closed") {
      return true;
    }

    const retentionUntil =
      application.retentionUntil ??
      new Date(application.closeAt.getTime() + retentionWindowMs);

    return now <= retentionUntil;
  });

  const applicationIds = visibleApplications.map((application) => application.id);

  // Fetch user-specific data only if authenticated
  let drafts: Array<{ applicationId: string; stepIndex: number; isSubmitted: boolean }> = [];
  let submissions: Array<{ id: string; applicationId: string; status: unknown; submittedAt: Date }> = [];

  if (userId) {
    [drafts, submissions] = await Promise.all([
      prisma.applicationDraft.findMany({
        where: {
          userId,
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
          userId,
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
          id: true,
          applicationId: true,
          status: true,
          submittedAt: true,
        },
      }),
    ]);
  }
  

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
      id: string;
      status: (typeof submissions)[number]["status"];
      submittedAt: string;
    }
  >();

  for (const submission of submissions) {
    if (!submissionByApplicationId.has(submission.applicationId)) {
      submissionByApplicationId.set(submission.applicationId, {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt.toISOString(),
      });
    }
  }

  return NextResponse.json({
    applications: visibleApplications.map((application) => ({
      ...application,
      draft: draftByApplicationId.get(application.id) ?? null,
      submissionStatus: submissionByApplicationId.get(application.id)?.status ?? null,
      submissionId: submissionByApplicationId.get(application.id)?.id ?? null,
      submittedAt: submissionByApplicationId.get(application.id)?.submittedAt ?? null,
    })),
    headers: {
      'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=30',
    },
  });
}
