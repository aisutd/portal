import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { getAdminUser } from "@/lib/admin-app-auth";
import { prisma } from "@/lib/prisma";

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
          user: { select: { email: true, profile: { select: { firstName: true, lastName: true, utdNetId: true, linkedinUrl: true, githubUrl: true, portfolioUrl: true, resumeFile: { select: { fileName: true } } } } } },
          reviews: { include: { reviewer: { select: { profile: { select: { firstName: true, lastName: true } }, email: true } } } },
        },
      },
    },
  });
  if (!application) return createErrorResponse("Application not found", "NOT_FOUND", 404);
  return NextResponse.json({ application });
}
