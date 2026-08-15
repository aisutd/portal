import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveStatusKey } from "./status.ts";

const SINCE = new Date(2026, 7, 1);

test("three or more check-ins this semester is active", () => {
  const checkIns = [new Date(2026, 7, 2), new Date(2026, 7, 3), new Date(2026, 7, 4)];
  assert.equal(deriveStatusKey(checkIns, SINCE), "active");
});

test("one or two check-ins is at risk", () => {
  assert.equal(deriveStatusKey([new Date(2026, 7, 2)], SINCE), "atRisk");
  assert.equal(deriveStatusKey([new Date(2026, 7, 2), new Date(2026, 7, 3)], SINCE), "atRisk");
});

test("no check-ins is inactive", () => {
  assert.equal(deriveStatusKey([], SINCE), "inactive");
});

test("check-ins before the semester start do not count", () => {
  const lastSemester = [new Date(2026, 3, 1), new Date(2026, 3, 2), new Date(2026, 3, 3)];
  assert.equal(deriveStatusKey(lastSemester, SINCE), "inactive");
});
