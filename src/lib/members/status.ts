import type { StatusKey } from "./badges";

/** Check-ins this semester needed to read as Active. */
export const ACTIVE_MIN_CHECK_INS = 3;
/** Check-ins this semester needed to read as At risk rather than Inactive. */
export const AT_RISK_MIN_CHECK_INS = 1;

/**
 * Participation heuristic. `checkIns` is every attendance timestamp for the
 * member; only those on or after `since` count.
 */
export function deriveStatusKey(checkIns: Date[], since: Date): StatusKey {
  const recent = checkIns.filter((date) => date >= since).length;
  if (recent >= ACTIVE_MIN_CHECK_INS) return "active";
  if (recent >= AT_RISK_MIN_CHECK_INS) return "atRisk";
  return "inactive";
}
