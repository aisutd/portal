# Admin Members Page — Design

**Date:** 2026-08-06
**Status:** Approved

## Problem

`/admin/users/1` renders a complete Members directory — stat cards, search,
filter chips, table, pagination — entirely from hardcoded arrays in
`src/lib/data.ts`. None of it reflects the database. This replaces the mock
data with real queries against Neon and makes the toolbar functional, without
changing the visual design.

## Constraints

- No schema migration. Every column must come from fields that exist today in
  `prisma/schema.prisma`.
- No writes to the database. The Neon instance holds real user data; the seed
  script is not extended and not run.
- The rendered design stays as-is. This is a data and interactivity change, not
  a redesign.
- Real `Profile` rows exist and may be incomplete. `Profile` is optional on
  `User`, and `utdNetId` is nullable. Both cases must render, not crash.

## Route

Move `src/app/admin/users/[id]/page.tsx` to `src/app/admin/members/page.tsx`.

The `[id]` route param is never read — this is a list page occupying a detail
route's URL, which is why `admin-sidebar.tsx` hardcodes a link to
`/admin/users/1`. Update that link to `/admin/members`.

This leaves `/admin/users/[id]` free for a genuine member-detail page later,
which is the natural destination for the `⋯` row menu.

## Architecture

The page stays a server component, following the `getEventViewModel()` pattern
established in `src/app/admin/events/page.tsx`. It awaits `searchParams` (a
`Promise` in Next 16) and pushes all filtering, sorting, and paging into
Prisma. No member data reaches the browser beyond the eight visible rows.

### URL contract

```
/admin/members?q=<text>&filter=all|officers|mentors|mentees&sort=az|za|recent&page=1
```

Page size is 8, matching the existing footer. Unrecognized `filter` or `sort`
values fall back to defaults rather than throwing. A `page` beyond the last is
clamped.

### Queries

Four groups per render, issued concurrently with `Promise.all`:

1. `user.findMany` — one page of 8, with
   `include: { profile: true, memberships: { where: { activeFlag: true } } }`.
   Sorted by `profile.lastName` for `az`/`za`, or `createdAt desc` for `recent`.
2. `user.count` — same `where` clause, for the footer range and page count.
3. `rSVP.findMany` — scoped to only the 8 visible `userId`s, filtered to
   `attendance: { isNot: null }`, selecting `userId` and
   `attendance.checkedInAt`. One query feeding both the Events count and the
   Status badge.
4. Stat-card aggregates — four small counts, unfiltered and independent of the
   current view.

Query 3 is deliberately scoped to the visible page. Counting attendance across
all members would grow with the table and is never displayed.

### Search

`q` matches, case-insensitively, against `User.email`, `Profile.utdNetId`,
`Profile.firstName`, and `Profile.lastName`, combined with `OR`.

### Filters

- `officers` — `User.role` in {REVIEWER, ORGANIZER, SUPER_ADMIN}
- `mentors` — an active `Membership` with type `AIM_MENTOR`
- `mentees` — an active `Membership` with type `AIM_MENTEE`
- `all` — no role constraint

## Derived fields

| Column | Source |
|---|---|
| Name | `prefName \|\| firstName` + `lastName`; email local-part when `Profile` is null |
| NetID | `Profile.utdNetId`; renders `—` when null |
| Role | See below |
| Events | Count of attended RSVPs, all time |
| Joined | `User.createdAt`, formatted `MMM YYYY` |
| Status | See below |

### Role

A single badge, resolved in priority order:

1. Officer — `User.role` is REVIEWER, ORGANIZER, or SUPER_ADMIN
2. Otherwise the active `Membership.membershipType`, mapped to Mentor
   (AIM_MENTOR), Mentee (AIM_MENTEE), Student (AI_STUDENT), Innovator
   (AI_INNOVATOR), or Alumnus (ALUMNUS)
3. Otherwise Member

Officer wins over membership type, so an organizer who is also a mentor reads
as Officer. Badge colors reuse the existing palette from `src/lib/data.ts`.

### Status

Derived from attendance since the start of the current semester:

- 3 or more — Active
- 1 to 2 — At risk
- 0 — Inactive

A new `src/lib/semester.ts` exports `semesterStart()`: August 1 for fall
(August through December), January 1 for spring (January through July).
Thresholds live in named constants so they can be tuned without hunting through
render code.

This is a heuristic, not a stored fact. It was chosen over the alternatives
because it uses attendance data the club already collects through QR scanning,
needs no migration, and measures actual participation — unlike
`User.lastLoginAt`, which would mark a member who attends everything but never
opens the portal as Inactive.

## Stat cards

All four are global and ignore the active filter:

- **total members** — `user.count()`
- **officers** — count where `role` in {REVIEWER, ORGANIZER, SUPER_ADMIN}
- **active this sem** — distinct users with attendance since `semesterStart()`
- **new this month** — count where `createdAt` is at or after the start of the
  current month

## Components

| File | Change |
|---|---|
| `src/app/admin/members/page.tsx` | Moved from `users/[id]`; gains the view-model query layer |
| `src/components/admin/members-table.tsx` | `Member` type gains `id`; row `key` moves from `netid` to `id`. Visuals unchanged |
| `src/components/admin/members-toolbar.tsx` | New client component: debounced search, filter chips, sort toggle — all writing to the URL |
| `src/components/admin/members-pagination.tsx` | New server component; plain `<Link>`s, no client JS |
| `src/components/admin/admin-sidebar.tsx` | Members link points to `/admin/members` |
| `src/lib/semester.ts` | New; semester boundary helper |
| `src/lib/data.ts` | Delete mock `members` and `memberStats`; keep `memberFilters` as chip labels |

The row `key` change matters: `utdNetId` is nullable, so keying on it collides
across every member missing one.

Only the toolbar is a client component, and only because the search box needs a
debounced `router.replace`. The table, pagination, and page remain server-side.

## Edge cases

- **No `Profile`** — name falls back to the email local-part, NetID shows `—`
- **Null `utdNetId`** — shows `—`
- **No members match** — an empty-state row replaces the table body
- **`page` past the end** — clamped to the last valid page
- **Invalid `filter` or `sort`** — silently falls back to defaults
- **No active `Membership`** — role resolves to Member
- **No attendance records** — Events shows 0, Status shows Inactive

The last point is expected on day one: with no `Attendance` rows in the
database, every member reads as Inactive with 0 events. That is correct
behavior, not a bug.

## Verification

The repository has no test framework, so verification is lint, build, and
manual inspection:

1. `npm run lint`
2. `npm run build`
3. In the browser, signed in as an officer: rows render from real data, each
   filter chip narrows the set correctly, search matches name / netid / email,
   pagination advances and clamps, and the footer range agrees with the total.

Step 3 requires a Clerk session and must be done by the user.

## Out of scope

- The **Export CSV** and **+ Invite** buttons stay decorative
- The `⋯` row menu stays inert
- A member-detail page at `/admin/users/[id]`
- The hardcoded `role="Officer"` label in the admin sidebar footer
- Seeding test data
