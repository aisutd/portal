import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveStatusKey, eventsNeededForActive } from "./status.ts";

test("no countable events yet reads as active, not inactive", () => {
  assert.equal(deriveStatusKey(0, 0), "active");
});

test("attending none of the countable events is inactive", () => {
  assert.equal(deriveStatusKey(0, 4), "inactive");
});

test("under half is at risk", () => {
  assert.equal(deriveStatusKey(1, 4), "atRisk");
  assert.equal(deriveStatusKey(2, 5), "atRisk");
});

test("exactly half is active", () => {
  assert.equal(deriveStatusKey(2, 4), "active");
});

test("attending everything is active", () => {
  assert.equal(deriveStatusKey(6, 6), "active");
});

test("a single event is all or nothing", () => {
  assert.equal(deriveStatusKey(0, 1), "inactive");
  assert.equal(deriveStatusKey(1, 1), "active");
});

test("an active member needs no further events", () => {
  assert.equal(eventsNeededForActive(3, 5), 0);
  assert.equal(eventsNeededForActive(2, 4), 0);
});

test("attending raises both sides of the ratio, so the gap is not naive", () => {
  // 1 of 4 is 25%. Attending 2 more gives 3 of 6, which is exactly half.
  assert.equal(eventsNeededForActive(1, 4), 2);
  assert.equal(eventsNeededForActive(0, 4), 4);
  assert.equal(eventsNeededForActive(2, 5), 1);
});

test("the answer always lands on or above half", () => {
  for (let countable = 1; countable <= 20; countable += 1) {
    for (let attended = 0; attended <= countable; attended += 1) {
      const k = eventsNeededForActive(attended, countable);
      assert.ok((attended + k) / (countable + k) >= 0.5);
    }
  }
});
