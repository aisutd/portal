import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

/** The form controls an auth error can be attached to. */
export type AuthField = "email" | "password" | "code" | "form";

export type AuthFieldErrors = Partial<Record<AuthField, string>>;

/** Clerk names the offending input in `meta.paramName`; sign-in calls it "identifier". */
const FIELD_BY_PARAM_NAME: Record<string, AuthField> = {
  email_address: "email",
  identifier: "email",
  password: "password",
  code: "code",
};

type ClerkErrorMeta = {
  paramName?: string;
  zxcvbn?: { suggestions: { code: string; message: string }[] };
};

/**
 * Unpacks the error returned by a Clerk call into per-field messages.
 *
 * Clerk wraps API failures in a ClerkAPIResponseError whose own `longMessage` is
 * always undefined — the user-facing detail ("password has been found in a data
 * breach", "password is too short", …) lives one level down in `errors[]`.
 * Anything we can't attach to a specific input falls back to "form".
 */
export function toFieldErrors(
  error: unknown,
  fallback: string
): AuthFieldErrors {
  if (!isClerkAPIResponseError(error) || error.errors.length === 0) {
    return { form: fallback };
  }

  const fieldErrors: AuthFieldErrors = {};

  for (const apiError of error.errors) {
    const meta: ClerkErrorMeta = apiError.meta ?? {};
    const field = FIELD_BY_PARAM_NAME[meta.paramName ?? ""] ?? "form";
    const message = apiError.longMessage || apiError.message;
    // Clerk orders errors most-relevant first, so keep the first one per field.
    fieldErrors[field] ??= withSuggestions(message, meta);
  }

  return fieldErrors;
}

/** Appends zxcvbn's "try adding another word" hints for weak-password errors. */
function withSuggestions(message: string, meta: ClerkErrorMeta): string {
  const suggestions = meta.zxcvbn?.suggestions ?? [];
  if (suggestions.length === 0) {
    return message;
  }
  return [message, ...suggestions.map((s) => s.message)].join(" ");
}
