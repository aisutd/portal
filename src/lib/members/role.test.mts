import { test } from "node:test";
import assert from "node:assert/strict";
import { roleBadges } from "./role.ts";

const labels = (...args: Parameters<typeof roleBadges>) =>
  roleBadges(...args).map((badge) => badge.label);

test("a plain member with no programs still gets one badge", () => {
  assert.deepEqual(labels("MEMBER", []), ["Member"]);
});

test("permission role comes before programs", () => {
  assert.deepEqual(labels("EXECUTIVE", ["AIM_MENTOR"]), ["Executive", "AIM Mentor"]);
});

test("an officer who mentors keeps both badges", () => {
  assert.deepEqual(labels("OFFICER", ["AIM_MENTOR"]), ["Officer", "AIM Mentor"]);
});

test("Member is dropped once a program is held", () => {
  assert.deepEqual(labels("MEMBER", ["AI_ACADEMY"]), ["AI Academy"]);
});

test("programs are ordered by the enum, not by the argument", () => {
  assert.deepEqual(labels("MEMBER", ["INNOVATION_LABS", "AIM_MENTEE"]), [
    "AIM Mentee",
    "Innovation Labs",
  ]);
});

test("duplicate programs are not repeated", () => {
  assert.deepEqual(labels("MEMBER", ["AI_ACADEMY", "AI_ACADEMY"]), ["AI Academy"]);
});
