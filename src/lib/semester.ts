/** First month (0-indexed) of the fall semester. */
const FALL_START_MONTH = 7; // August

/**
 * Start of the semester containing `now`. Fall runs August through December;
 * spring covers January through July.
 */
export function semesterStart(now: Date = new Date()): Date {
  const year = now.getFullYear();
  return now.getMonth() >= FALL_START_MONTH
    ? new Date(year, FALL_START_MONTH, 1)
    : new Date(year, 0, 1);
}

/** Midnight on the first day of the month containing `now`. */
export function startOfMonth(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
