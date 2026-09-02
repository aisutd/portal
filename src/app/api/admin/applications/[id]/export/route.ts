import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const dynamicQuestions = (appData.questionsJson as Array<{ id: string; label: string; type?: string }>) || [];

  const csvHeaders = selectedFields.map((fieldKey) => {
    if (fieldKey.startsWith("q_")) {
      const qId = fieldKey.replace(/^q_/, "");
      const q = dynamicQuestions.find((item) => item.id === qId);
      const label = q ? q.label : qId;
      return `"${label.replace(/"/g, '""')}"`;
    }
    return `"${fieldKey.replace(".", " ").toUpperCase()}"`;
  });

  // Helper to extract nested properties dynamically
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };

  const csvRows = appData.submissions.map((sub) => {
    const payload = (sub.formPayloadJson ?? {}) as Record<string, any>;

    return selectedFields.map((fieldKey) => {
      let rawVal: any = "";

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

        rawVal =
          payload[qId] ??
          (questionObj ? payload[questionObj.label] : undefined) ??
          payload[fieldKey] ??
          "";
      }

      let strVal = "";
      if (rawVal !== null && rawVal !== undefined) {
        if (rawVal instanceof Date) {
          strVal = rawVal.toISOString();
        } else if (typeof rawVal === "object") {
          if (Array.isArray(rawVal)) {
            strVal = rawVal.join(", ");
          } else if (rawVal.fileName && (rawVal.url || rawVal.key)) {
            strVal = rawVal.url || rawVal.key || rawVal.fileName;
          } else {
            strVal = JSON.stringify(rawVal);
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