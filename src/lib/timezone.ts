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

/**
 * 2. CT String (from Form Input) -> UTC Date for Prisma
 * Input format: "YYYY-MM-DDTHH:mm"
 */
export function chicagoInputToUtc(localDateTimeString: string): Date {
  if (!localDateTimeString || typeof localDateTimeString !== "string") {
    return new Date(NaN);
  }

  // Ensures "2026-03-30T14:30" is interpreted specifically in Chicago Time,
  // then converts seamlessly to a standard UTC Date.
  const chicagoDate = new TZDate(localDateTimeString, CHICAGO_TZ);
  
  return new Date(chicagoDate.getTime());
}

/** Formats UTC Date or ISO string into Chicago timezone (YYYY-MM-DDTHH:mm) for HTML5 datetime-local inputs */
export function formatChicagoDateTimeInput(dateInput?: Date | string | null): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const hour = partMap.hour === "24" ? "00" : partMap.hour;
  return `${partMap.year}-${partMap.month}-${partMap.day}T${hour}:${partMap.minute}`;
}

/**
 * Formats a UTC ISO string or Date into a human-readable Chicago display format.
 * Example output: "Sep 4, 2026, 2:57 PM" or "TBD" if null/invalid.
 */
export function formatChicagoDisplayDate(value?: Date | string | null): string {
  if (!value) return "TBD";

  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "TBD";

  return date.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });
}