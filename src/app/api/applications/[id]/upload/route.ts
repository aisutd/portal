import { NextResponse, type NextRequest } from "next/server";
import { putObjectToR2 } from "@/lib/r2";
import { getAuthenticatedUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;

    const user = await getAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }
    const userId = user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const questionId = (formData.get("questionId") as string) || "general";

    if (!file) {
      return NextResponse.json(
        { error: { message: "No file provided" } },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Construct Storage Key: applications/applicationId/userId/questionId/FILE
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `applications/${applicationId}/${userId}/${questionId}/${Date.now()}_${safeFileName}`;

    const publicUrl = await putObjectToR2(storageKey, buffer, file.type);

    if (!publicUrl) {
      return NextResponse.json(
        { error: { message: "Failed to upload file to storage" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: publicUrl,
      key: storageKey,
      fileName: file.name,
    });
  } catch (err) {
    console.error("Upload API Error:", err);
    return NextResponse.json(
      { error: { message: "Internal Server Error" } },
      { status: 500 }
    );
  }
}