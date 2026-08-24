export const CENTRAL_TIME_ZONE = "America/Chicago";

/**
 * Parse a "datetime-local" string (e.g. "2026-09-10T19:00") as a wall time in America/Chicago
 * and return a Date object representing the equivalent instant in UTC (suitable for DB storage).
 *
 * This mirrors the approach previously implemented in admin/events/actions.ts but centralizes it.
 */
export function parseChicagoTimeToUtc(localDateTimeString: string): Date {
  if (!localDateTimeString) return new Date(NaN);

  const [datePart, timePart] = localDateTimeString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart || "").split(":").map(Number);

  // Intl-based formatter for America/Chicago that gives canonical parts for an instant
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CENTRAL_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  // Start with an initial guess (interpret the wall time as UTC)
  let utcGuess = Date.UTC(year, month - 1, day, hour, minute);

  // Iteratively refine the guess by comparing the formatted representation in the target
  // timezone to the requested wall time. This converges quickly (usually in 1-2 iterations)
  // and correctly handles DST transitions.
  for (let i = 0; i < 5; i++) {
    const parts = formatter.formatToParts(new Date(utcGuess));
    const partMap: Record<string, string> = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }

    const formattedUtc = Date.UTC(
      Number(partMap.year),
      Number(partMap.month) - 1,
      Number(partMap.day),
      Number(partMap.hour) === 24 ? 0 : Number(partMap.hour),
      Number(partMap.minute),
      Number(partMap.second)
    );

    const delta = utcGuess - formattedUtc;
    if (delta === 0) break;
    // Adjust guess by delta - this moves the guess closer to the true UTC instant
    utcGuess += delta;
  }

  return new Date(utcGuess);
}

/**
 * Format a Date (which is an instant in time, typically from the DB in UTC) into a string
 * suitable for an HTML <input type="datetime-local"> by rendering the wall time in
 * America/Chicago and returning "YYYY-MM-DDTHH:mm" (no timezone suffix).
 */
export function formatDateTimeForInput(date: Date): string {
  if (!date || isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CENTRAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) partMap[p.type] = p.value;

  // Handle Intl returning "24" for midnight in some locales
  const hour = partMap.hour === "24" ? "00" : partMap.hour;

  return `${partMap.year}-${partMap.month}-${partMap.day}T${hour}:${partMap.minute}`;
}
