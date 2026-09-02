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
