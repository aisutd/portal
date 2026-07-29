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
