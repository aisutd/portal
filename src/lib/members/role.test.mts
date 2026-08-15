import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveRoleKey } from "./role.ts";

test("officer wins over membership type", () => {
  assert.equal(deriveRoleKey("ORGANIZER", "AIM_MENTOR"), "officer");
  assert.equal(deriveRoleKey("REVIEWER", null), "officer");
  assert.equal(deriveRoleKey("SUPER_ADMIN", "AI_STUDENT"), "officer");
});

test("plain members fall back to their membership type", () => {
  assert.equal(deriveRoleKey("MEMBER", "AIM_MENTOR"), "mentor");
  assert.equal(deriveRoleKey("MEMBER", "AIM_MENTEE"), "mentee");
  assert.equal(deriveRoleKey("MEMBER", "AI_STUDENT"), "student");
  assert.equal(deriveRoleKey("MEMBER", "AI_INNOVATOR"), "innovator");
  assert.equal(deriveRoleKey("MEMBER", "ALUMNUS"), "alumnus");
});

test("no membership resolves to member", () => {
  assert.equal(deriveRoleKey("MEMBER", null), "member");
  assert.equal(deriveRoleKey("MEMBER", "NON_MEMBER"), "member");
});

test("unknown membership types resolve to member", () => {
  assert.equal(deriveRoleKey("MEMBER", "SOMETHING_NEW"), "member");
});
