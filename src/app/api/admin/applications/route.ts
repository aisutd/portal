import { ProgramType } from "@prisma/client";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { getAdminUser } from "@/lib/admin-app-auth";
import { logAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const programTypes = Object.values(ProgramType);

export async function GET() {
  const currentUser = await getAdminUser();
  if ("error" in currentUser) return currentUser.error;

  const applications = await prisma.programApplication.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      programType: true,
      roles: true,
      eligibility: true,
      openAt: true,
      closeAt: true,
      decisionDate: true,
      visibleToUsers: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { submissions: true } },
      submissions: { select: { status: true } },
    },
  });

  return NextResponse.json({
    applications: applications.map(({ submissions, _count, ...application }) => ({
      ...application,
      submissionCount: _count.submissions,
      acceptedCount: submissions.filter((submission) => submission.status === "ACCEPTED").length,
      inReviewCount: submissions.filter((submission) => ["SUBMITTED", "IN_REVIEW"].includes(submission.status)).length,
    })),
  });
}

export async function POST(request: Request) {
  const currentUser = await getAdminUser();
  if ("error" in currentUser) return currentUser.error;

  let body: unknown;
  try { body = await request.json(); } catch { return createErrorResponse("Invalid JSON body", "BAD_REQUEST", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return createErrorResponse("Invalid request body", "BAD_REQUEST", 400);
  }
  const data = body as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : "";
  const programType = typeof data.programType === "string" ? data.programType : "";
  const openAt = typeof data.openAt === "string" ? new Date(data.openAt) : null;
  const closeAt = typeof data.closeAt === "string" ? new Date(data.closeAt) : null;
  const decisionDate = typeof data.decisionDate === "string" && data.decisionDate ? new Date(data.decisionDate) : null;
  
  const questions = Array.isArray(data.questions) ? data.questions : [];

  if (!title || !description || !programTypes.includes(programType as ProgramType) || !openAt || !closeAt || Number.isNaN(openAt.getTime()) || Number.isNaN(closeAt.getTime()) || openAt >= closeAt || (decisionDate && Number.isNaN(decisionDate.getTime()))) {
    return createErrorResponse("Provide a title, description, valid program type, and an opening time before closing time.", "BAD_REQUEST", 400);
  }

  const application = await prisma.programApplication.create({
    data: {
      title,
      description,
      roles: data.roles,              // 👈 Pass to Prisma
      eligibility: data.eligibility,
      questionsJson: questions,
      requiredProfileFields: data.requiredProfileFields ?? {}, // Stores the whole object
      programType: programType as ProgramType,
      openAt,
      closeAt,
      decisionDate,
      visibleToUsers: data.visibleToUsers !== false,
      createdById: currentUser.user.id,
    },
  });

  await logAction({ actorId: currentUser.user.id, actionType: "APPLICATION_CREATED", entityType: "ProgramApplication", entityId: application.id });
  return NextResponse.json({ application }, { status: 201 });
}
