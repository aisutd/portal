import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { getAdminUser } from "@/lib/admin-app-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Helper role checks
function canModifyApplication(role?: string) {
  return role === "EXECUTIVE" || role === "DIRECTOR";
}

function canDeleteApplication(role?: string) {
  return role === "EXECUTIVE";
}

const updateApplicationSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  roles: z.array(z.string()).default([]),
  eligibility: z.array(z.string()).default([]),
  link: z.array(z.string()).default([]),
  programType: z.string().optional(),
  openAt: z.string().datetime().nullable().optional(),
  closeAt: z.string().datetime().nullable().optional(),
  visibleToUsers: z.boolean().optional(),
  questions: z.any().optional(),
  requiredProfileFields: z
    .object({
      requirePhoneNumber: z.boolean().optional(),
      requirePersonalEmail: z.boolean().optional(),
      requireResume: z.boolean().optional(),
      requireLinkedin: z.boolean().optional(),
      requireGithub: z.boolean().optional(),
      requirePortfolio: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getAdminUser();
  if ("error" in currentUser) return currentUser.error;
  
  const { id } = await params;
  const application = await prisma.programApplication.findUnique({
    where: { id },
    include: {
      submissions: {
        orderBy: { submittedAt: "desc" },
        include: {
          user: { 
            select: { 
              email: true, 
              profile: { 
                select: { 
                  firstName: true, 
                  lastName: true, 
                  utdNetId: true, 
                  linkedinUrl: true, 
                  githubUrl: true, 
                  portfolioUrl: true, 
                  resumeFile: { select: { fileName: true } } 
                } 
              } 
            } 
          },
          reviews: { 
            include: { 
              reviewer: { 
                select: { 
                  profile: { select: { firstName: true, lastName: true } }, 
                  email: true 
                } 
              } 
            } 
          },
        },
      },
    },
  });

  if (!application) return createErrorResponse("Application not found", "NOT_FOUND", 404);

  return NextResponse.json({ 
    application: {
      ...application,
      questions: application.questionsJson ?? [],
    },
    questions: application.questionsJson ?? [], 
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getAdminUser();
  if ("error" in currentUser) return currentUser.error;

  // Authorization Check: Must be Director or Executive
  if (!canModifyApplication(currentUser.user.role)) {
    return createErrorResponse("Forbidden: Only Directors and Executives can edit or publish applications.", "FORBIDDEN", 403);
  }

  const { id } = await params;

  try {
    const rawBody = await request.json();
    const parsed = updateApplicationSchema.safeParse(rawBody);

    if (!parsed.success) {
      return createErrorResponse("Invalid request body", "BAD_REQUEST", 400, parsed.error.format());
    }

    const {
      title,
      description,
      roles,
      eligibility,
      link,
      programType,
      openAt,
      closeAt,
      visibleToUsers,
      questions,
      requiredProfileFields,
    } = parsed.data;
    
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (programType !== undefined) updateData.programType = programType;
    if (roles !== undefined) updateData.roles = roles;
    if (link !== undefined) updateData.link = link;
    if (eligibility !== undefined) updateData.eligibility = eligibility;
    if (visibleToUsers !== undefined) updateData.visibleToUsers = visibleToUsers;
    if (questions !== undefined) updateData.questionsJson = questions;
    if (requiredProfileFields !== undefined) updateData.requiredProfileFields = requiredProfileFields;

    if (openAt !== undefined) {
      updateData.openAt = openAt ? new Date(openAt) : null;
    }
    if (closeAt !== undefined) {
      updateData.closeAt = closeAt ? new Date(closeAt) : null;
    }

    const updatedApplication = await prisma.programApplication.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      application: {
        ...updatedApplication,
        questions: updatedApplication.questionsJson ?? [],
      },
    });
  } catch (error) {
    console.error("Failed to update application:", error);
    return createErrorResponse("Failed to update application", "INTERNAL_SERVER_ERROR", 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getAdminUser();
  if ("error" in currentUser) return currentUser.error;

  // Authorization Check: Must be Executive
  if (!canDeleteApplication(currentUser.user.role)) {
    return createErrorResponse("Forbidden: Only Executive team members can delete applications.", "FORBIDDEN", 403);
  }

  const { id } = await params;

  try {
    const existingApplication = await prisma.programApplication.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingApplication) {
      return createErrorResponse("Application not found", "NOT_FOUND", 404);
    }

    // Execute deletion sequence in a single interactive transaction
    await prisma.$transaction(async (tx) => {
      // 1. Fetch submission IDs tied to this application
      const submissions = await tx.applicationSubmission.findMany({
        where: { applicationId: id },
        select: { id: true },
      });
      const submissionIds = submissions.map((s) => s.id);

      // 2. Cascade delete dependent ApplicationReview records
      if (submissionIds.length > 0) {
        await tx.applicationReview.deleteMany({
          where: { submissionId: { in: submissionIds } },
        });
      }

      // 3. Cascade delete ApplicationSubmission records
      await tx.applicationSubmission.deleteMany({
        where: { applicationId: id },
      });

      // 4. Cascade delete ApplicationDraft records
      await tx.applicationDraft.deleteMany({
        where: { applicationId: id },
      });

      // 5. Delete the primary ProgramApplication record
      await tx.programApplication.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: "Application and all associated drafts, submissions, and reviews deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("Failed to delete application:", error);
    return createErrorResponse("Failed to delete application", "INTERNAL_SERVER_ERROR", 500);
  }
}