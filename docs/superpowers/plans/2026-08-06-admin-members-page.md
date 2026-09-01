# Admin Members Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded mock data on the admin Members page with real Prisma queries against Neon, and make the search, filter, sort, and pagination controls functional.

**Architecture:** The page stays a Next 16 server component that awaits `searchParams` and pushes all filtering, sorting, and paging into Prisma, following the `getEventViewModel()` pattern in `src/app/admin/events/page.tsx`. Pure derivation logic (semester boundaries, role resolution, status thresholds, URL parsing) lives in small testable modules under `src/lib/`; only the search box is a client component.

**Tech Stack:** Next.js 16.2.9 (App Router, Turbopack), React 19, Prisma with the Neon serverless adapter, Tailwind, Clerk (unchanged), `node --test` for unit tests.

**Spec:** `docs/superpowers/specs/2026-08-06-admin-members-page-design.md`

## Global Constraints

- **No schema migration.** `prisma/schema.prisma` must not change. Every column comes from existing fields.
- **No database writes.** Do not extend or run `prisma/seed.ts`. The Neon instance holds real user data.
- **No visual redesign.** The rendered output must match the current page. This is a data and interactivity change only.
- **No new dependencies.** Tests use Node 24's built-in `node --test`, which runs `.mts` files natively.
- `Profile` is optional on `User`, and `Profile.utdNetId` is nullable. Both cases must render, never throw.
- `searchParams` is a `Promise` in Next 16 and **must be awaited**.
- Test files use `.test.mts` and **relative imports only** — the `@/*` path alias is a bundler feature and does not resolve under `node --test`.
- Page size is **8**, matching the existing footer.
- Officer roles are exactly `REVIEWER`, `ORGANIZER`, `SUPER_ADMIN` — the same set already used in `src/proxy.ts:14`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/semester.ts` | Semester and month boundary dates. No dependencies. |
| `src/lib/members/badges.ts` | Badge label and color tables for role and status. |
| `src/lib/members/role.ts` | Resolve a role key from `User.role` + membership type. |
| `src/lib/members/status.ts` | Resolve a status key from check-in dates. |
| `src/lib/members/query-params.ts` | Parse and build the `/admin/members` URL contract. |
| `src/lib/members/view-model.ts` | Prisma queries; assembles rows and stat cards. |
| `src/components/admin/members-toolbar.tsx` | Client: debounced search, filter chips, sort toggle. |
| `src/components/admin/members-pagination.tsx` | Server: prev/next and page-number links. |
| `src/app/admin/members/page.tsx` | Page shell; awaits `searchParams`, renders the view model. |

Modified: `src/components/admin/members-table.tsx`, `src/components/admin/admin-sidebar.tsx`, `src/lib/data.ts`, `package.json`.
Deleted: `src/app/admin/users/[id]/page.tsx`.

---

### Task 1: Semester boundaries + test harness

**Files:**
- Create: `src/lib/semester.ts`
- Test: `src/lib/semester.test.mts`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Consumes: nothing
- Produces: `semesterStart(now?: Date): Date`, `startOfMonth(now?: Date): Date`

- [ ] **Step 1: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "node --test \"src/**/*.test.mts\""
```

- [ ] **Step 2: Write the failing test**

Create `src/lib/semester.test.mts`:

```ts
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './semester.ts'`

- [ ] **Step 4: Write the implementation**

Create `src/lib/semester.ts`:

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 5 tests

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/semester.ts src/lib/semester.test.mts
git commit -m "Add semester boundary helpers and node --test harness"
```

---

### Task 2: Role and status derivation

**Files:**
- Create: `src/lib/members/badges.ts`, `src/lib/members/role.ts`, `src/lib/members/status.ts`
- Test: `src/lib/members/role.test.mts`, `src/lib/members/status.test.mts`

**Interfaces:**
- Consumes: `MemberBadge` type from `src/components/admin/members-table.tsx`
- Produces:
  - `type RoleKey = "officer" | "mentor" | "mentee" | "student" | "innovator" | "alumnus" | "member"`
  - `type StatusKey = "active" | "atRisk" | "inactive"`
  - `ROLE_BADGES: Record<RoleKey, MemberBadge>`, `STATUS_BADGES: Record<StatusKey, MemberBadge>`
  - `deriveRoleKey(userRole: string, membershipType: string | null): RoleKey`
  - `deriveStatusKey(checkIns: Date[], since: Date): StatusKey`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/members/role.test.mts`:

```ts
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
```

Create `src/lib/members/status.test.mts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot find `./role.ts` and `./status.ts`

- [ ] **Step 3: Write the badge tables**

Create `src/lib/members/badges.ts`. Colors are lifted verbatim from the mock data being deleted in Task 8, so the rendered pills are unchanged:

The import is relative rather than `@/`-aliased so that `node --test` can load
this module without a bundler.

```ts
import type { MemberBadge } from "../../components/admin/members-table";

export type RoleKey =
  | "officer"
  | "mentor"
  | "mentee"
  | "student"
  | "innovator"
  | "alumnus"
  | "member";

export type StatusKey = "active" | "atRisk" | "inactive";

export const ROLE_BADGES: Record<RoleKey, MemberBadge> = {
  officer: { label: "Officer", bg: "#e1e8ff", color: "#1f3aa3" },
  mentor: { label: "Mentor", bg: "#e9e5f6", color: "#4b4178" },
  mentee: { label: "Mentee", outline: true },
  student: { label: "Student", outline: true },
  innovator: { label: "Innovator", bg: "#e9e5f6", color: "#4b4178" },
  alumnus: { label: "Alumnus", outline: true },
  member: { label: "Member", outline: true },
};

export const STATUS_BADGES: Record<StatusKey, MemberBadge> = {
  active: { label: "Active", bg: "#d3eccf", color: "#356b2e" },
  atRisk: { label: "At risk", bg: "#fbe3cb", color: "#7a4416" },
  inactive: { label: "Inactive", bg: "#efece3", color: "#6a685f" },
};
```

- [ ] **Step 4: Write the role resolver**

Create `src/lib/members/role.ts`:

```ts
import type { RoleKey } from "./badges";

/** Same set the admin route gate uses in src/proxy.ts. */
const OFFICER_ROLES = new Set(["REVIEWER", "ORGANIZER", "SUPER_ADMIN"]);

const MEMBERSHIP_ROLE: Record<string, RoleKey> = {
  AIM_MENTOR: "mentor",
  AIM_MENTEE: "mentee",
  AI_STUDENT: "student",
  AI_INNOVATOR: "innovator",
  ALUMNUS: "alumnus",
  NON_MEMBER: "member",
};

/**
 * One badge per member. An officer reads as Officer even when they also hold
 * a mentor or mentee membership.
 */
export function deriveRoleKey(userRole: string, membershipType: string | null): RoleKey {
  if (OFFICER_ROLES.has(userRole)) return "officer";
  if (membershipType) return MEMBERSHIP_ROLE[membershipType] ?? "member";
  return "member";
}
```

- [ ] **Step 5: Write the status resolver**

Create `src/lib/members/status.ts`:

```ts
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
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 14 tests total across all three test files

- [ ] **Step 7: Commit**

```bash
git add src/lib/members/badges.ts src/lib/members/role.ts src/lib/members/status.ts src/lib/members/role.test.mts src/lib/members/status.test.mts
git commit -m "Add member role and status derivation"
```

---

### Task 3: URL contract parsing

**Files:**
- Create: `src/lib/members/query-params.ts`
- Test: `src/lib/members/query-params.test.mts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `PAGE_SIZE: 8`
  - `MEMBER_FILTERS`, `MEMBER_SORTS` readonly tuples
  - `type MemberFilter = "all" | "officers" | "mentors" | "mentees"`
  - `type MemberSort = "az" | "za" | "recent"`
  - `type MembersQuery = { q: string; filter: MemberFilter; sort: MemberSort; page: number }`
  - `parseMembersQuery(raw: Record<string, string | string[] | undefined>): MembersQuery`
  - `membersHref(current: MembersQuery, patch: Partial<MembersQuery>): string`

- [ ] **Step 1: Write the failing test**

Create `src/lib/members/query-params.test.mts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './query-params.ts'`

- [ ] **Step 3: Write the implementation**

Create `src/lib/members/query-params.ts`:

```ts
export const MEMBERS_PATH = "/admin/members";

/** Rows per page. Matches the "Showing 1–8 of N" footer. */
export const PAGE_SIZE = 25;

export const MEMBER_FILTERS = ["all", "officers", "mentors", "mentees"] as const;
export const MEMBER_SORTS = ["az", "za", "recent"] as const;

export type MemberFilter = (typeof MEMBER_FILTERS)[number];
export type MemberSort = (typeof MEMBER_SORTS)[number];

export type MembersQuery = {
  q: string;
  filter: MemberFilter;
  sort: MemberSort;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Never throws. Unrecognized values silently become defaults. */
export function parseMembersQuery(raw: RawParams): MembersQuery {
  const filter = first(raw.filter) as MemberFilter;
  const sort = first(raw.sort) as MemberSort;
  const page = Number.parseInt(first(raw.page), 10);

  return {
    q: first(raw.q).trim(),
    filter: MEMBER_FILTERS.includes(filter) ? filter : "all",
    sort: MEMBER_SORTS.includes(sort) ? sort : "az",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/**
 * Builds a members URL from the current query plus a patch. Changing the
 * search, filter, or sort resets to page 1 unless a page is given explicitly —
 * otherwise narrowing the set can strand the user on an empty page.
 */
export function membersHref(current: MembersQuery, patch: Partial<MembersQuery>): string {
  const resetsPage =
    patch.page === undefined && ("q" in patch || "filter" in patch || "sort" in patch);
  const next: MembersQuery = { ...current, ...patch, ...(resetsPage ? { page: 1 } : {}) };

  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.filter !== "all") params.set("filter", next.filter);
  if (next.sort !== "az") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));

  const queryString = params.toString();
  return queryString ? `${MEMBERS_PATH}?${queryString}` : MEMBERS_PATH;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 24 tests total

- [ ] **Step 5: Commit**

```bash
git add src/lib/members/query-params.ts src/lib/members/query-params.test.mts
git commit -m "Add members URL contract parsing"
```

---

### Task 4: Prisma view model

**Files:**
- Create: `src/lib/members/view-model.ts`

**Interfaces:**
- Consumes: `semesterStart`, `startOfMonth` (Task 1); `ROLE_BADGES`, `STATUS_BADGES`, `deriveRoleKey`, `deriveStatusKey` (Task 2); `PAGE_SIZE`, `MembersQuery` (Task 3); `Member` from `members-table.tsx`; `StatCardData` from `stat-card.tsx`
- Produces: `getMembersViewModel(query: MembersQuery): Promise<MembersViewModel>` where
  `MembersViewModel = { rows: Member[]; stats: StatCardData[]; total: number; page: number; pageCount: number; rangeStart: number; rangeEnd: number }`

No unit test — this hits the database. It is verified by type-check and build in this task, and visually in Task 8.

- [ ] **Step 1: Write the implementation**

Create `src/lib/members/view-model.ts`:

```ts
import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { semesterStart, startOfMonth } from "@/lib/semester";
import type { Member } from "@/components/admin/members-table";
import type { StatCardData } from "@/components/admin/stat-card";
import { ROLE_BADGES, STATUS_BADGES } from "./badges";
import { deriveRoleKey } from "./role";
import { deriveStatusKey } from "./status";
import { PAGE_SIZE, type MembersQuery } from "./query-params";

const OFFICER_ROLES: UserRole[] = ["REVIEWER", "ORGANIZER", "SUPER_ADMIN"];

const JOINED_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  month: "short",
  year: "numeric",
});

export type MembersViewModel = {
  rows: Member[];
  stats: StatCardData[];
  total: number;
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
};

function buildWhere(query: MembersQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (query.q) {
    const contains = { contains: query.q, mode: "insensitive" as const };
    where.OR = [
      { email: contains },
      { profile: { is: { utdNetId: contains } } },
      { profile: { is: { firstName: contains } } },
      { profile: { is: { lastName: contains } } },
    ];
  }

  if (query.filter === "officers") {
    where.role = { in: OFFICER_ROLES };
  } else if (query.filter === "mentors") {
    where.memberships = { some: { activeFlag: true, membershipType: "AIM_MENTOR" } };
  } else if (query.filter === "mentees") {
    where.memberships = { some: { activeFlag: true, membershipType: "AIM_MENTEE" } };
  }

  return where;
}

function buildOrderBy(sort: MembersQuery["sort"]): Prisma.UserOrderByWithRelationInput {
  if (sort === "recent") return { createdAt: "desc" };
  return { profile: { lastName: sort === "za" ? "desc" : "asc" } };
}

/** Members without a Profile row still need a name in the table. */
function displayName(
  profile: { prefName: string; firstName: string; lastName: string } | null,
  email: string
): string {
  if (!profile) return email.split("@")[0];
  const given = profile.prefName.trim() || profile.firstName;
  return `${given} ${profile.lastName}`.trim() || email.split("@")[0];
}

export async function getMembersViewModel(query: MembersQuery): Promise<MembersViewModel> {
  const where = buildWhere(query);
  const semStart = semesterStart();

  // `total` is the filtered count driving pagination; `totalMembers` is the
  // unfiltered stat card. They differ whenever a filter is active.
  const [total, totalMembers, officerCount, activeUsers, newThisMonth] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count(),
    prisma.user.count({ where: { role: { in: OFFICER_ROLES } } }),
    prisma.rSVP.findMany({
      where: { attendance: { is: { checkedInAt: { gte: semStart } } } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth() } } }),
  ]);

  // Clamp the page so a stale or hand-edited ?page= never renders an empty table.
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), pageCount);

  const users = await prisma.user.findMany({
    where,
    orderBy: buildOrderBy(query.sort),
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      profile: true,
      memberships: { where: { activeFlag: true }, take: 1 },
    },
  });

  // Attendance only for the rows actually on screen.
  const userIds = users.map((user) => user.id);
  const attendedRsvps = userIds.length
    ? await prisma.rSVP.findMany({
        where: { userId: { in: userIds }, attendance: { isNot: null } },
        select: { userId: true, attendance: { select: { checkedInAt: true } } },
      })
    : [];

  const checkInsByUser = new Map<string, Date[]>();
  for (const rsvp of attendedRsvps) {
    if (!rsvp.attendance) continue;
    const existing = checkInsByUser.get(rsvp.userId) ?? [];
    existing.push(rsvp.attendance.checkedInAt);
    checkInsByUser.set(rsvp.userId, existing);
  }

  const rows: Member[] = users.map((user) => {
    const checkIns = checkInsByUser.get(user.id) ?? [];
    const membershipType = user.memberships[0]?.membershipType ?? null;

    return {
      id: user.id,
      name: displayName(user.profile, user.email),
      netid: user.profile?.utdNetId ?? "—",
      role: ROLE_BADGES[deriveRoleKey(user.role, membershipType)],
      events: String(checkIns.length),
      joined: JOINED_FORMAT.format(user.createdAt),
      status: STATUS_BADGES[deriveStatusKey(checkIns, semStart)],
    };
  });

  const stats: StatCardData[] = [
    { value: String(totalMembers), label: "total members" },
    { value: String(officerCount), label: "officers" },
    { value: String(activeUsers.length), label: "active this sem" },
    { value: String(newThisMonth), label: "new this month", highlight: true },
  ];

  return {
    rows,
    stats,
    total,
    page,
    pageCount,
    rangeStart: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    rangeEnd: Math.min(page * PAGE_SIZE, total),
  };
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: two errors, both in `view-model.ts`, reporting that `id` does not exist on type `Member`. That is expected — Task 5 adds it.

If any *other* error appears, fix it before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/lib/members/view-model.ts
git commit -m "Add members view model backed by Prisma"
```

---

### Task 5: Add a stable row key to the table

**Files:**
- Modify: `src/components/admin/members-table.tsx:10-17` (the `Member` type) and `:56` (the row `key`)

**Interfaces:**
- Consumes: nothing
- Produces: `Member` type gains `id: string`

`utdNetId` is nullable, so every member missing one renders `key="—"` and React collides them. The `id` is the `User.id` cuid.

- [ ] **Step 1: Add `id` to the Member type**

In `src/components/admin/members-table.tsx`, change:

```ts
export type Member = {
  name: string;
```

to:

```ts
export type Member = {
  /** User.id — the row key. NetID is nullable and cannot be used. */
  id: string;
  name: string;
```

- [ ] **Step 2: Key rows by id**

In the same file, change `key={m.netid}` to `key={m.id}`.

- [ ] **Step 3: Verify the type error moved**

Run: `npx tsc --noEmit`
Expected: errors now point at `src/lib/data.ts` (the mock `members` array lacks `id`), not at `view-model.ts`. Task 8 deletes that array.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/members-table.tsx
git commit -m "Key member rows by user id instead of nullable netid"
```

---

### Task 6: Toolbar

**Files:**
- Create: `src/components/admin/members-toolbar.tsx`

**Interfaces:**
- Consumes: `MembersQuery`, `membersHref`, `MemberFilter`, `MemberSort` (Task 3)
- Produces: `<MembersToolbar query={query} />`

The only client component in this feature. The search box needs local state so typing feels instant, plus a debounce so each keystroke does not hit the database.

- [ ] **Step 1: Write the component**

Create `src/components/admin/members-toolbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  membersHref,
  type MemberFilter,
  type MemberSort,
  type MembersQuery,
} from "@/lib/members/query-params";

const FILTER_LABELS: Record<MemberFilter, string> = {
  all: "All",
  officers: "Officers",
  mentors: "Mentors",
  mentees: "Mentees",
};

const SORT_LABELS: Record<MemberSort, string> = {
  az: "sort: A–Z",
  za: "sort: Z–A",
  recent: "sort: newest",
};

/** Cycles when the sort pill is clicked. */
const NEXT_SORT: Record<MemberSort, MemberSort> = {
  az: "za",
  za: "recent",
  recent: "az",
};

const DEBOUNCE_MS = 300;

export function MembersToolbar({ query }: { query: MembersQuery }) {
  const router = useRouter();
  const [term, setTerm] = useState(query.q);

  // Keep the box in sync when the URL changes from outside (back button,
  // filter chip), without clobbering what the user is mid-way through typing.
  useEffect(() => {
    setTerm(query.q);
  }, [query.q]);

  useEffect(() => {
    if (term === query.q) return;
    const timer = setTimeout(() => {
      router.replace(membersHref(query, { q: term }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term, query, router]);

  return (
    <div className="flex w-full items-center gap-[12px]">
      <input
        type="text"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="🔍 search name / netid / email…"
        aria-label="Search members"
        className="h-[42px] flex-1 rounded-[8px] bg-search-field px-[14px] font-mono text-[12px] text-search-ink placeholder:text-search-ink focus:outline-none"
      />

      {(Object.keys(FILTER_LABELS) as MemberFilter[]).map((filter) => (
        <Link key={filter} href={membersHref(query, { filter })}>
          <Button
            variant={query.filter === filter ? "soft" : "ghost"}
            size="sm"
            className="rounded-[8px]"
          >
            {FILTER_LABELS[filter]}
          </Button>
        </Link>
      ))}

      <Link href={membersHref(query, { sort: NEXT_SORT[query.sort] })} aria-label="Change sort">
        <Badge label={SORT_LABELS[query.sort]} variant="outline" />
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors from this file. The pre-existing `src/lib/data.ts` errors from Task 5 remain.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/members-toolbar.tsx
git commit -m "Add URL-driven members toolbar"
```

---

### Task 7: Pagination

**Files:**
- Create: `src/components/admin/members-pagination.tsx`

**Interfaces:**
- Consumes: `MembersQuery`, `membersHref` (Task 3)
- Produces: `<MembersPagination query={query} page={number} pageCount={number} rangeStart={number} rangeEnd={number} total={number} />`

A server component — these are plain links, so no client JavaScript is needed.

- [ ] **Step 1: Write the component**

Create `src/components/admin/members-pagination.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { membersHref, type MembersQuery } from "@/lib/members/query-params";

/** How many numbered page pills to show at once. */
const WINDOW = 3;

type Props = {
  query: MembersQuery;
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
};

/** A sliding window of page numbers that keeps the current page in view. */
function pageWindow(page: number, pageCount: number): number[] {
  const start = Math.max(1, Math.min(page - 1, pageCount - WINDOW + 1));
  const end = Math.min(pageCount, start + WINDOW - 1);
  const pages: number[] = [];
  for (let n = start; n <= end; n += 1) pages.push(n);
  return pages;
}

export function MembersPagination({
  query,
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
}: Props) {
  return (
    <div className="flex w-full items-center justify-between">
      <span className="font-mono text-[12px] leading-[16.8px] tracking-[0.2px] text-ink-faint">
        Showing {rangeStart}–{rangeEnd} of {total}
      </span>

      <div className="flex items-center gap-[8px]">
        {page > 1 ? (
          <Link href={membersHref(query, { page: page - 1 })}>
            <Button variant="ghost" size="sm" className="rounded-[8px]">
              ‹ Prev
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" size="sm" className="rounded-[8px] opacity-40" disabled>
            ‹ Prev
          </Button>
        )}

        {pageWindow(page, pageCount).map((n) =>
          n === page ? (
            <Badge key={n} label={String(n)} bg="#e1e8ff" color="#1f3aa3" />
          ) : (
            <Link key={n} href={membersHref(query, { page: n })}>
              <Badge label={String(n)} variant="outline" />
            </Link>
          )
        )}

        {page < pageCount ? (
          <Link href={membersHref(query, { page: page + 1 })}>
            <Button variant="ghost" size="sm" className="rounded-[8px]">
              Next ›
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" size="sm" className="rounded-[8px] opacity-40" disabled>
            Next ›
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/members-pagination.tsx
git commit -m "Add members pagination"
```

---

### Task 8: Wire up the page and remove the mock data

**Files:**
- Create: `src/app/admin/members/page.tsx`
- Delete: `src/app/admin/users/[id]/page.tsx`
- Modify: `src/components/admin/admin-sidebar.tsx:10`, `src/lib/data.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–7
- Produces: the working page

- [ ] **Step 1: Create the new page**

Create `src/app/admin/members/page.tsx`:

```tsx
import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { StatCard } from "@/components/admin/stat-card";
import { MembersTable } from "@/components/admin/members-table";
import { MembersToolbar } from "@/components/admin/members-toolbar";
import { MembersPagination } from "@/components/admin/members-pagination";
import { Button } from "@/components/ui/button";
import { parseMembersQuery } from "@/lib/members/query-params";
import { getMembersViewModel } from "@/lib/members/view-model";

export const metadata: Metadata = {
  title: "AIS Admin — Members",
  description: "Browse and manage AIS members.",
};

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = parseMembersQuery(await searchParams);
  const view = await getMembersViewModel(query);

  return (
    <div className="flex min-h-screen w-full bg-cream">
      <AdminSidebar active="Members" role="Officer" />

      <div className="flex h-full flex-1 flex-col gap-[20px] p-[46px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[32px] font-bold leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
            Members
          </h2>
          <div className="flex gap-[10px]">
            <Button variant="ghost" size="md">
              Export CSV
            </Button>
            <Button variant="primary" size="md">
              + Invite
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="flex w-full gap-[16px]">
          {view.stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Toolbar */}
        <MembersToolbar query={query} />

        {/* Table */}
        {view.rows.length > 0 ? (
          <MembersTable members={view.rows} />
        ) : (
          <div className="w-full rounded-[14px] border border-border-soft bg-white px-[22px] py-[40px] text-center font-body text-[15px] text-ink-muted">
            No members match this search.
          </div>
        )}

        {/* Footer / pagination */}
        <MembersPagination
          query={query}
          page={view.page}
          pageCount={view.pageCount}
          rangeStart={view.rangeStart}
          rangeEnd={view.rangeEnd}
          total={view.total}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete the old page and confirm nothing else links to it**

```bash
git rm -r "src/app/admin/users"
grep -rn "admin/users" src/
```

Expected from the grep: only `src/components/admin/admin-sidebar.tsx`. If anything else appears, update it to `/admin/members` too.

- [ ] **Step 3: Point the sidebar at the new route**

In `src/components/admin/admin-sidebar.tsx`, change:

```ts
  Members: "/admin/users/1",
```

to:

```ts
  Members: "/admin/members",
```

- [ ] **Step 4: Delete the mock data**

In `src/lib/data.ts`, delete the `memberStats` array, the `ROLE` and `STATUS` constant objects, and the `members` array — everything under the `/* ------ Admin · Members */` banner except `memberFilters`, which stays.

Then delete the now-unused import at the top of the file:

```ts
import type { Member } from "@/components/admin/members-table";
```

Leave `memberFilters` and the `FilterChip` type alone — `reviewFilters` still uses `FilterChip`.

- [ ] **Step 5: Verify the whole thing**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Expected: 24 tests pass, no type errors, no lint errors, build succeeds.

If `memberFilters` is now unused anywhere, lint will flag it — delete it too and remove its `FilterChip` annotation only if `reviewFilters` no longer needs the type.

- [ ] **Step 6: Confirm the route responds**

```bash
npm run dev
```

In another shell:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/admin/members
```

Expected: `307 http://localhost:3000/sign-in` — the Clerk gate in `src/proxy.ts` redirecting an unauthenticated request. This confirms the route exists and middleware matches it. A `404` means the route move failed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Back the admin members page with real data"
```

- [ ] **Step 8: Hand off for visual verification**

The remaining checks need a signed-in officer session and must be done by the user in a browser at `/admin/members`:

1. Rows render real names, netids, and join dates from the database
2. Each filter chip narrows the set; the active chip is tinted
3. Search matches against name, netid, and email
4. The sort pill cycles A–Z → Z–A → newest
5. Prev/Next move between pages and disable at the ends
6. The footer range agrees with the total, and the stat cards are plausible

Expect every member to show **0 events** and an **Inactive** badge until `Attendance` rows exist. Per the spec that is correct behavior, not a defect.

---

## Notes for the implementer

- `mode: "insensitive"` requires PostgreSQL. This project uses Neon, so it is available.
- `orderBy: { profile: { lastName: ... } }` orders across an optional relation. Members without a `Profile` sort last, which is the desired behavior.
- Do not add a `Membership` include to the stat-card queries. Those counts are global by design and must not change when a filter is applied.
- `prisma.rSVP` is the correct client property name — Prisma lowercases only the first character of the `RSVP` model.
