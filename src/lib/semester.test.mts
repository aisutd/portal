import { test } from "node:test";
import assert from "node:assert/strict";
import { semesterStart, startOfMonth } from "./semester.ts";

test("August starts the fall semester", () => {
  assert.deepEqual(semesterStart(new Date(2026, 7, 6)), new Date(2026, 7, 1));
});

test("December is still the fall semester", () => {
  assert.deepEqual(semesterStart(new Date(2026, 11, 31)), new Date(2026, 7, 1));
});

test("July belongs to the spring semester", () => {
  assert.deepEqual(semesterStart(new Date(2026, 6, 31)), new Date(2026, 0, 1));
});

test("January starts the spring semester", () => {
  assert.deepEqual(semesterStart(new Date(2026, 0, 1)), new Date(2026, 0, 1));
});

test("startOfMonth truncates to the first of the month", () => {
  assert.deepEqual(startOfMonth(new Date(2026, 7, 6, 17, 30)), new Date(2026, 7, 1));
});
