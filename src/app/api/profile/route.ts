import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session.userId) {
    return createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401);
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkId: session.userId,
    },
    select: {
      id: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          middleName: true,
          prefName: true,
          year: true,
          degree: true,
          major: true,
          phoneNumber: true,
          personalEmail: true,
          utdEmail: true,
          utdNetId: true,
          githubUrl: true,
          linkedinUrl: true,
          portfolioUrl: true,
          resumeFile: {
            select: {
              id: true,
              fileName: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return createErrorResponse("User not found", "USER_NOT_FOUND", 404);
  }

  return NextResponse.json({
    profile: user.profile,
  });
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session.userId) {
      return createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401);
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { id: true, profile: { select: { id: true } } },
    });

    if (!user) {
      return createErrorResponse("User not found", "USER_NOT_FOUND", 404);
    }

    const body = await req.json();

    const allowedFields = [
      "firstName",
      "lastName",
      "middleName",
      "prefName",
      "utdNetId",
      "year",
      "degree",
      "major",
      "phoneNumber",
      "personalEmail",
      "utdEmail",
      "linkedinUrl",
      "githubUrl",
      "portfolioUrl",
      "resumeFileId",
    ];

    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key];
      }
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        firstName: (body.firstName as string) ?? "",
        lastName: (body.lastName as string) ?? "",
        middleName: (body.middleName as string) ?? "",
        profileCompletionStatus: "INCOMPLETE",
        ...updateData,
      },
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Profile patch error:", error);
    return createErrorResponse("Failed to update profile", "INTERNAL_ERROR", 500);
  }
}