import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApplicationReviewer } from "@/lib/admin-app-auth";
import { canManageApplications, canReviewProgramType } from "@/lib/roles";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // This route had no authorization of its own: any signed-in user, including a
  // plain member, could export any posting's full submission set by id.
  const reviewer = await getApplicationReviewer();
  if ("error" in reviewer) return reviewer.error;

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "export";
  const fieldsRaw = searchParams.get("fields");

  if (!fieldsRaw) {
    return new NextResponse("No export fields specified", { status: 400 });
  }

  const selectedFields: string[] = JSON.parse(fieldsRaw);

  const appData = await prisma.programApplication.findUnique({
    where: { id },
    include: {
      submissions: {
        include: { user: { include: { profile: true } } },
      },
    },
  });

  if (!appData) return new NextResponse("Application not found", { status: 404 });

  // A scoped reviewer exports only their own programs' postings.
  if ((appData.isArchived && !canManageApplications(reviewer.user.role)) ||
      !canReviewProgramType(reviewer.allowedProgramTypes, appData.programType)) {
    return new NextResponse("Application not found", { status: 404 });
  }

  const dynamicQuestions = (appData.questionsJson as Array<{ id: string; label: string; type?: string }>) || [];

  const csvHeaders = selectedFields.map((fieldKey) => {
    if (fieldKey.startsWith("q_")) {
      const qId = fieldKey.replace(/^q_/, "");
      const q = dynamicQuestions.find((item) => item.id === qId);
      const label = q ? q.label.trim() : qId;
      return `"${label.replace(/"/g, '""')}"`;
    }
    return `"${fieldKey.replace(".", " ").toUpperCase()}"`;
  });

  // Helper to extract nested properties dynamically
  const getNestedValue = (obj: unknown, path: string): unknown => {
    return path.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };

  const csvRows = appData.submissions.map((sub) => {
    const payload = (sub.formPayloadJson ?? {}) as Record<string, unknown>;

    return selectedFields.map((fieldKey) => {
      let rawVal: unknown = "";

      if (fieldKey.startsWith("profile.")) {
        const path = fieldKey.replace(/^profile\./, "");
        rawVal = getNestedValue(sub.user?.profile, path);
      } else if (fieldKey.startsWith("user.")) {
        const path = fieldKey.replace(/^user\./, "");
        rawVal = getNestedValue(sub.user, path);
      } else if (fieldKey.startsWith("submission.")) {
        const path = fieldKey.replace(/^submission\./, "");
        rawVal = getNestedValue(sub, path);
      } else if (fieldKey.startsWith("q_")) {
        const qId = fieldKey.replace(/^q_/, "");
        const questionObj = dynamicQuestions.find((q) => q.id === qId);

        if (payload[qId] !== undefined) {
          rawVal = payload[qId];
        } else if (questionObj && payload[questionObj.label] !== undefined) {
          rawVal = payload[questionObj.label];
        } else if (questionObj) {
          const cleanLabel = questionObj.label.trim();
          const matchedKey = Object.keys(payload).find(
            (key) => key.trim() === cleanLabel
          );
          rawVal = matchedKey ? payload[matchedKey] : (payload[fieldKey] ?? "");
        } else {
          rawVal = payload[fieldKey] ?? "";
        }
      }

      let strVal = "";
      if (rawVal !== null && rawVal !== undefined) {
        if (rawVal instanceof Date) {
          strVal = rawVal.toISOString();
        } else if (typeof rawVal === "object") {
          if (Array.isArray(rawVal)) {
            strVal = rawVal.join(", ");
          } else {
            const obj = rawVal as Record<string, unknown>;
            if (obj.fileName && (obj.url || obj.key)) {
              strVal = String(obj.url || obj.key || obj.fileName);
            } else {
              strVal = JSON.stringify(rawVal);
            }
          }
        } else {
          strVal = String(rawVal);
        }
      }

      return `"${strVal.replace(/"/g, '""')}"`;
    });
  });

  const csvContent = [csvHeaders.join(","), ...csvRows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${appData.title.replace(/[^a-z0-9]/gi, "_")}_${type}.csv"`,
    },
  });
}
