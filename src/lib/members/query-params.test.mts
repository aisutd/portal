import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMembersQuery, membersHref } from "./query-params.ts";

test("empty params produce defaults", () => {
  assert.deepEqual(parseMembersQuery({}), { q: "", filter: "all", sort: "az", page: 1 });
});

test("valid params are preserved", () => {
  assert.deepEqual(parseMembersQuery({ q: "ava", filter: "mentors", sort: "recent", page: "3" }), {
    q: "ava",
    filter: "mentors",
    sort: "recent",
    page: 3,
  });
});

test("invalid filter and sort fall back to defaults", () => {
  const parsed = parseMembersQuery({ filter: "wizards", sort: "sideways" });
  assert.equal(parsed.filter, "all");
  assert.equal(parsed.sort, "az");
});

test("non-positive and unparseable pages fall back to 1", () => {
  assert.equal(parseMembersQuery({ page: "0" }).page, 1);
  assert.equal(parseMembersQuery({ page: "-2" }).page, 1);
  assert.equal(parseMembersQuery({ page: "banana" }).page, 1);
});

test("repeated params take the first value", () => {
  assert.equal(parseMembersQuery({ q: ["ava", "bilal"] }).q, "ava");
});

test("search terms are trimmed", () => {
  assert.equal(parseMembersQuery({ q: "  ava  " }).q, "ava");
});

test("href omits default values", () => {
  const query = parseMembersQuery({});
  assert.equal(membersHref(query, {}), "/admin/members");
});

test("href includes non-default values", () => {
  const query = parseMembersQuery({ q: "ava", filter: "mentors", page: "2" });
  assert.equal(membersHref(query, {}), "/admin/members?q=ava&filter=mentors&page=2");
});

test("changing the filter resets the page", () => {
  const query = parseMembersQuery({ filter: "mentors", page: "5" });
  assert.equal(membersHref(query, { filter: "officers" }), "/admin/members?filter=officers");
});

test("changing the page explicitly does not reset it", () => {
  const query = parseMembersQuery({ filter: "mentors", page: "5" });
  assert.equal(membersHref(query, { page: 6 }), "/admin/members?filter=mentors&page=6");
});
