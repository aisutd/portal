import type { StatusKey } from "./badges";

/** Share of a member's countable events they must attend to read as Active. */
export const ACTIVE_ATTENDANCE_RATIO = 0.5;

/**
 * Participation status, measured against the events that actually applied to
 * this member: those tagged for one of their programs, plus general untagged
 * events. Only events that have already ended count, so an upcoming event
 * never drags anyone down.
 *
 * - no countable events yet   -> Active (nothing to have missed)
 * - attended none of them     -> Inactive
 * - attended under half       -> At risk
 * - otherwise                 -> Active
 */
export function deriveStatusKey(attended: number, countable: number): StatusKey {
  if (countable <= 0) return "active";
  if (attended <= 0) return "inactive";
  return attended / countable < ACTIVE_ATTENDANCE_RATIO ? "atRisk" : "active";
}

/**
 * How many further events the member must attend to reach Active.
 *
 * Attending an upcoming event raises both sides of the ratio, so this is not
 * simply the gap to 50%. Solving (attended + k) / (countable + k) >= 1/2 gives
 * k >= countable - 2 * attended.
 */
export function eventsNeededForActive(attended: number, countable: number): number {
  return Math.max(0, countable - 2 * attended);
}
