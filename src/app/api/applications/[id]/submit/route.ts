import { auth } from "@clerk/nextjs/server";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import {
  QuestionConfig,
  buildFormLayout,
  normalizeFieldLabel,
  parseQuestionConfigs,
  validateFields,
} from "@/lib/application-form";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const session = await auth();
  if (!session.userId) {
    return { error: createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401) } as const;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: session.userId },
    select: { id: true },
  });

  if (!user) {
    return { error: createErrorResponse("User not found", "USER_NOT_FOUND", 404) } as const;
  }

  return { userId: user.id } as const;
}

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if ("error" in currentUser) return currentUser.error;

  const { id } = await ctx.params;
  const now = new Date();

  const application = await prisma.programApplication.findFirst({
    where: { id },
    select: {
      id: true,
      questionsJson: true,
      requiredProfileFields: true,
      openAt: true,
      closeAt: true,
    },
  });

  if (!application) {
    return createErrorResponse("Application not found", "NOT_FOUND", 404);
  }

  // Validate application window constraints
  if (now < application.openAt) {
    return createErrorResponse("Application window is not open yet.", "BAD_REQUEST", 400);
  }
  if (now > application.closeAt) {
    return createErrorResponse("Application window has closed.", "BAD_REQUEST", 400);
  }

  const layout = buildFormLayout(application.questionsJson);

  // Parse application custom questions
  const rawQuestions = Array.isArray(application.questionsJson)
    ? (application.questionsJson as Array<string | QuestionConfig>)
    : [];
  const questionsMap = parseQuestionConfigs(rawQuestions);

  // Default hardcoded personal field requirements (from personalFields array)
  const defaultRequiredPersonalFields = [
    "First Name",
    "Last Name",
    "NetID",
    "Year",
    "Major",
    "Degree",
    "UTD Email",
  ];

  defaultRequiredPersonalFields.forEach((label) => {
    const config: QuestionConfig = { label, required: true };
    questionsMap[label] = config;
    questionsMap[`${label} *`] = config;
  });

  // Map dynamic admin profile field requirements to questionsMap
  if (application.requiredProfileFields && typeof application.requiredProfileFields === "object") {
    const reqs = application.requiredProfileFields as Record<string, boolean | undefined>;
    const profileMapping: Record<string, string> = {
      requirePhoneNumber: "Phone Number",
      requirePersonalEmail: "Personal Email",
      requireResume: "Resume",
      requireLinkedin: "LinkedIn",
      requireGithub: "GitHub",
      requirePortfolio: "Portfolio",
    };

    Object.entries(profileMapping).forEach(([reqKey, fieldLabel]) => {
      const isRequired = Boolean(reqs[reqKey]);
      const config: QuestionConfig = {
        label: fieldLabel,
        required: isRequired,
      };

      // Register under raw, normalized, and starred key formats
      questionsMap[fieldLabel] = config;
      questionsMap[normalizeFieldLabel(fieldLabel)] = config;
      questionsMap[`${fieldLabel} *`] = config;
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const [draft, latestSubmission] = await Promise.all([
      tx.applicationDraft.findUnique({
        where: {
          applicationId_userId: {
            applicationId: id,
            userId: currentUser.userId,
          },
        },
        select: {
          formPayloadJson: true,
          isSubmitted: true,
        },
      }),
      tx.applicationSubmission.findFirst({
        where: {
          applicationId: id,
          userId: currentUser.userId,
        },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      }),
    ]);

    if (latestSubmission || draft?.isSubmitted) {
      return {
        error: createErrorResponse("Application already submitted", "ALREADY_SUBMITTED", 409),
      } as const;
    }

    if (!draft) {
      return { error: createErrorResponse("Draft not found", "BAD_REQUEST", 400) } as const;
    }

    // Safely extract values regardless of trailing asterisk presence in draft keys
    const rawPayload =
      draft.formPayloadJson && typeof draft.formPayloadJson === "object"
        ? (draft.formPayloadJson as Record<string, unknown>)
        : {};

    const answers: Record<string, string> = {};

    for (const label of layout.allFieldLabels) {
      const cleanKey = normalizeFieldLabel(label);
      const val =
        rawPayload[label] ??
        rawPayload[cleanKey] ??
        rawPayload[`${cleanKey} *`];

      const stringVal = typeof val === "string" ? val.trim() : "";
      
      // Store under both raw label and normalized label key
      answers[label] = stringVal;
      answers[cleanKey] = stringVal;
    }

    // Run field validations with complete questions map
    const fieldErrors = validateFields(answers, layout.allFieldLabels, questionsMap);

    if (Object.keys(fieldErrors).length > 0) {
      return {
        error: createErrorResponse(
          "Some answers are missing or incorrectly formatted.",
          "INVALID_APPLICATION",
          400,
          { fields: fieldErrors }
        ),
      } as const;
    }

    const normalizedFormPayloadJson =
      draft.formPayloadJson === null
        ? Prisma.JsonNull
        : (draft.formPayloadJson as Prisma.InputJsonValue);

    const submission = await tx.applicationSubmission.create({
      data: {
        applicationId: id,
        userId: currentUser.userId,
        versionNumber: 1,
        formPayloadJson: normalizedFormPayloadJson,
        status: ApplicationStatus.SUBMITTED,
      },
      select: {
        id: true,
        versionNumber: true,
        status: true,
        submittedAt: true,
      },
    });

    await tx.applicationDraft.delete({
      where: {
        applicationId_userId: {
          applicationId: id,
          userId: currentUser.userId,
        },
      },
    });

    return { submission } as const;
  });

  if ("error" in result) {
    return result.error;
  }

  return NextResponse.json({ submission: result.submission });
}