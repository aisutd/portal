import { personalFields } from "@/lib/data";
import { EMAIL_DOMAIN_ERROR, isAllowedEmail } from "@/lib/email-domains";

export const PERSONAL_STEP = "Personal";
export const QUESTIONS_STEP = "Long Answers";
export const REVIEW_STEP = "Review";

export const RESUME_FIELD = "Resume *";

const PHONE_FIELD = "Phone Number";
const PERSONAL_EMAIL_FIELD = "Personal Email *";
const UTD_EMAIL_FIELD = "UTD Email *";
const LINKEDIN_FIELD = "LinkedIn *";

export type FieldValues = Record<string, string>;

export type ApplicationFormLayout = {
  steps: string[];
  stepFieldGroups: string[][];
  allFieldLabels: string[];
  questionLabels: string[];
  reviewStepIndex: number;
};

export function normalizeQuestions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const taken = new Set<string>(personalFields);
  const questions: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const label = entry.trim();
    if (!label || taken.has(label)) {
      continue;
    }

    taken.add(label);
    questions.push(label);
  }

  return questions;
}

export function buildFormLayout(questions: unknown): ApplicationFormLayout {
  const questionLabels = normalizeQuestions(questions);
  const steps = [PERSONAL_STEP];
  const stepFieldGroups: string[][] = [[...personalFields]];

  if (questionLabels.length > 0) {
    steps.push(QUESTIONS_STEP);
    stepFieldGroups.push(questionLabels);
  }

  const allFieldLabels = stepFieldGroups.flat();
  const reviewStepIndex = steps.length;
  steps.push(REVIEW_STEP);
  stepFieldGroups.push([]);

  return {
    steps,
    stepFieldGroups,
    allFieldLabels,
    questionLabels,
    reviewStepIndex,
  };
}

export const EMPTY_LAYOUT: ApplicationFormLayout = buildFormLayout([]);

export function emptyFieldValues(allFieldLabels: readonly string[]): FieldValues {
  return allFieldLabels.reduce((acc, field) => {
    acc[field] = "";
    return acc;
  }, {} as FieldValues);
}

export function toFieldValues(
  allFieldLabels: readonly string[],
  values: Partial<FieldValues>,
): FieldValues {
  return allFieldLabels.reduce((acc, field) => {
    acc[field] = values[field] ?? "";
    return acc;
  }, {} as FieldValues);
}

export function extractStringValues(
  allFieldLabels: readonly string[],
  payload: unknown,
): Partial<FieldValues> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const record = payload as Record<string, unknown>;
  const values: Partial<FieldValues> = {};

  for (const field of allFieldLabels) {
    const value = record[field];
    if (typeof value === "string") {
      values[field] = value;
    }
  }

  return values;
}

export function collectExtraAnswers(
  allFieldLabels: readonly string[],
  payload: unknown,
): Array<[string, string]> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }

  const known = new Set(allFieldLabels);

  return Object.entries(payload as Record<string, unknown>)
    .filter(
      (entry): entry is [string, string] =>
        !known.has(entry[0]) && typeof entry[1] === "string" && entry[1].trim() !== "",
    )
    .sort(([a], [b]) => a.localeCompare(b));
}

export function isRequiredField(label: string) {
  return label.trim().endsWith("*");
}

export function findFirstStepWithError(
  stepFieldGroups: readonly (readonly string[])[],
  errors: Record<string, string>,
): number {
  return stepFieldGroups.findIndex((fields) =>
    fields.some((field) => field in errors),
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

const LINKEDIN_PATTERN = /^(https?:\/\/)?([\w-]+\.)*linkedin\.com\/\S+$/i;

function isValidPhone(value: string) {
  if (!/^\+?[\d\s().-]+$/.test(value)) {
    return false;
  }

  const digits = value.replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 15;
}

const fieldFormatErrors: Record<string, (value: string) => string | null> = {
  [PHONE_FIELD]: (value) =>
    isValidPhone(value)
      ? null
      : "Enter a phone number, e.g. (469) 555-0142.",
  [PERSONAL_EMAIL_FIELD]: (value) =>
    EMAIL_PATTERN.test(value)
      ? null
      : "Enter a valid email address, e.g. you@example.com.",
  [UTD_EMAIL_FIELD]: (value) => {
    if (!EMAIL_PATTERN.test(value)) {
      return "Enter a valid email address.";
    }

    return isAllowedEmail(value) ? null : EMAIL_DOMAIN_ERROR;
  },
  [LINKEDIN_FIELD]: (value) =>
    LINKEDIN_PATTERN.test(value)
      ? null
      : "Enter a LinkedIn profile URL, e.g. linkedin.com/in/your-name.",
};

export function validateFields(
  values: FieldValues,
  fields: readonly string[],
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = values[field]?.trim() ?? "";

    if (!value) {
      if (isRequiredField(field)) {
        errors[field] = "This field is required.";
      }

      continue;
    }

    const message = fieldFormatErrors[field]?.(value);

    if (message) {
      errors[field] = message;
    }
  }

  return errors;
}
