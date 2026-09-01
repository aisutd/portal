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
    const body = await request.json();
    const { title, description, programType, openAt, closeAt, visibleToUsers, questions } = body;
    
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (programType !== undefined) updateData.programType = programType;
    if (visibleToUsers !== undefined) updateData.visibleToUsers = Boolean(visibleToUsers);
    if (questions !== undefined) updateData.questionsJson = questions;

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
    });

    if (!existingApplication) {
      return createErrorResponse("Application not found", "NOT_FOUND", 404);
    }

    await prisma.programApplication.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Application deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("Failed to delete application:", error);
    return createErrorResponse("Failed to delete application", "INTERNAL_SERVER_ERROR", 500);
  }
}