/**
 * Portal accounts are limited to UTD students and AIS officers.
 *
 * Matching is on the exact domain, so subdomains (e.g. student.utdallas.edu)
 * are not accepted — add them here if UTD ever starts issuing them.
 */
export const ALLOWED_EMAIL_DOMAINS: readonly string[] = [
  "utdallas.edu",
  "aisociety.io",
];

/** Shown to the user whenever an address is rejected. */
export const EMAIL_DOMAIN_ERROR =
  "Use your @utdallas.edu or @aisociety.io email address.";

/** True when `email` belongs to one of the allowed domains. */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at === -1) {
    return false;
  }

  return ALLOWED_EMAIL_DOMAINS.includes(normalized.slice(at + 1));
}
