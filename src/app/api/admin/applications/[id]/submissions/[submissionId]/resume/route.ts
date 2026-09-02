import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role === "MEMBER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId } = await ctx.params;

    const submission = await prisma.applicationSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          include: {
            profile: {
              include: { resumeFile: true },
            },
          },
        },
      },
    });

    const file = submission?.user?.profile?.resumeFile;

    if (!file?.storageKey) {
      return NextResponse.json({ error: "Resume file not found" }, { status: 404 });
    }

    const publicBase = (
      process.env.R2_PUBLIC_URL ?? 
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? 
      ""
    ).replace(/\/$/, "");

    const fileUrl = `${publicBase}/${file.storageKey}`;
    return NextResponse.redirect(fileUrl);

  } catch (error) {
    console.error("Resume retrieval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}