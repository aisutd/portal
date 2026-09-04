// lib/timezone.ts
import { TZDate } from "@date-fns/tz";
import { formatInTimeZone } from "date-fns-tz";

export const CHICAGO_TZ = "America/Chicago";

/**
 * 1. UTC Date (from DB) -> CT String for <input type="datetime-local">
 * Output format: "YYYY-MM-DDTHH:mm"
 */
export function utcToChicagoInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  // formatInTimeZone explicitly handles CDT/CST shifts automatically
  return formatInTimeZone(d, CHICAGO_TZ, "yyyy-MM-dd'T'HH:mm");
}

/** Alias for backward compatibility if used elsewhere in your app */
export const formatChicagoDateTimeInput = utcToChicagoInput;

/**
 * 2. CT String (from Form Input) -> UTC Date for Prisma
 * Input format: "YYYY-MM-DDTHH:mm"
 */
export function chicagoInputToUtc(localDateTimeString: string): Date {
  if (!localDateTimeString || typeof localDateTimeString !== "string") {
    return new Date(NaN);
  }

  // Interprets local time string in Chicago context and returns standard UTC Date
  return new TZDate(localDateTimeString, CHICAGO_TZ);
}

/**
 * 3. Formats a UTC ISO string or Date into a human-readable Chicago display format.
 * Example output: "Sep 4, 2026, 2:57 PM" or "TBD" if null/invalid.
 */
export function formatChicagoDisplayDate(value?: Date | string | null): string {
  if (!value) return "TBD";

  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "TBD";

  return date.toLocaleString("en-US", {
    timeZone: CHICAGO_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  });
}