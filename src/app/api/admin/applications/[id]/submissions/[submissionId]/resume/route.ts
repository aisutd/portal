import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApplicationReviewer, postingOutOfScopeResponse } from "@/lib/admin-app-auth";
import { canReviewProgramType } from "@/lib/roles";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    // Was a flat "role must not be MEMBER" check, which would lock out AIM
    // mentors — they review with role MEMBER and an AIM_MENTOR membership.
    const reviewer = await getApplicationReviewer();
    if ("error" in reviewer) return reviewer.error;

    const { submissionId } = await ctx.params;

    const submission = await prisma.applicationSubmission.findUnique({
      where: { id: submissionId },
      include: {
        application: { select: { programType: true } },
        user: {
          include: {
            profile: {
              include: { resumeFile: true },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Resume file not found" }, { status: 404 });
    }

    // Scope against the submission's own posting, not the id in the URL.
    if (!canReviewProgramType(reviewer.allowedProgramTypes, submission.application.programType)) {
      return postingOutOfScopeResponse();
    }

    const publicBase = (
      process.env.R2_PUBLIC_URL ?? 
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? 
      ""
    ).replace(/\/$/, "");

    // Check if submission formPayloadJson contains an application-specific resume
    const payload =
      submission.formPayloadJson && typeof submission.formPayloadJson === "object"
        ? (submission.formPayloadJson as Record<string, unknown>)
        : {};

    const resumeVal = payload["Resume"] ?? payload["Resume *"];
    if (typeof resumeVal === "string" && resumeVal.trim()) {
      try {
        const parsed = JSON.parse(resumeVal);
        const customUrl = parsed.url || parsed.key;
        if (customUrl) {
          if (customUrl.startsWith("http://") || customUrl.startsWith("https://")) {
            return NextResponse.redirect(customUrl);
          }
          if (publicBase) {
            return NextResponse.redirect(`${publicBase}/${customUrl}`);
          }
        }
      } catch {
        if (resumeVal.startsWith("http://") || resumeVal.startsWith("https://")) {
          return NextResponse.redirect(resumeVal);
        }
      }
    }

    const file = submission.user?.profile?.resumeFile;

    if (!file?.storageKey) {
      return NextResponse.json({ error: "Resume file not found" }, { status: 404 });
    }

    const fileUrl = `${publicBase}/${file.storageKey}`;
    return NextResponse.redirect(fileUrl);

  } catch (error) {
    console.error("Resume retrieval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}