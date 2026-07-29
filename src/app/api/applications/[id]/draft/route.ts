import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createErrorResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const session = await auth();

  if (!session.userId) {
    return {
      error: createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401),
    } as const;
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkId: session.userId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return {
      error: createErrorResponse("User not found", "USER_NOT_FOUND", 404),
    } as const;
  }

  return { userId: user.id } as const;
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/applications/[id]/draft">
) {
  const currentUser = await getCurrentUser();
  if ("error" in currentUser) {
    return currentUser.error;
  }

  const { id } = await ctx.params;

  const application = await prisma.programApplication.findFirst({
    where: {
      id,
      visibleToUsers: true,
    },
    select: {
      id: true,
    },
  });

  if (!application) {
    return createErrorResponse("Application not found", "NOT_FOUND", 404);
  }

  const draft = await prisma.applicationDraft.findUnique({
    where: {
      applicationId_userId: {
        applicationId: id,
        userId: currentUser.userId,
      },
    },
    select: {
      formPayloadJson: true,
      stepIndex: true,
    },
  });

  return NextResponse.json({
    draft: draft ?? null,
  });
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/applications/[id]/draft">
) {
  const currentUser = await getCurrentUser();
  if ("error" in currentUser) {
    return currentUser.error;
  }

  const { id } = await ctx.params;

  const application = await prisma.programApplication.findFirst({
    where: {
      id,
      visibleToUsers: true,
    },
    select: {
      id: true,
    },
  });

  if (!application) {
    return createErrorResponse("Application not found", "NOT_FOUND", 404);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createErrorResponse("Invalid JSON body", "BAD_REQUEST", 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    !("formPayloadJson" in body) ||
    !("stepIndex" in body)
  ) {
    return createErrorResponse("Invalid request body", "BAD_REQUEST", 400);
  }

  const { formPayloadJson, stepIndex } = body as {
    formPayloadJson: unknown;
    stepIndex: unknown;
  };

  if (
    typeof stepIndex !== "number" ||
    !Number.isInteger(stepIndex) ||
    stepIndex < 0
  ) {
    return createErrorResponse("Invalid stepIndex", "BAD_REQUEST", 400);
  }

  const normalizedFormPayloadJson =
    formPayloadJson === null
      ? Prisma.JsonNull
      : (formPayloadJson as Prisma.InputJsonValue);

  const draft = await prisma.applicationDraft.upsert({
    where: {
      applicationId_userId: {
        applicationId: id,
        userId: currentUser.userId,
      },
    },
    create: {
      applicationId: id,
      userId: currentUser.userId,
      formPayloadJson: normalizedFormPayloadJson,
      stepIndex,
    },
    update: {
      formPayloadJson: normalizedFormPayloadJson,
      stepIndex,
    },
    select: {
      formPayloadJson: true,
      stepIndex: true,
    },
  });

  return NextResponse.json({
    draft,
  });
}
