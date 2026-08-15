import type { MemberFilter, MemberSort } from "./query-params";

export const FILTER_LABELS: Record<MemberFilter, string> = {
  all: "All",
  officers: "Officers",
  mentors: "Mentors",
  mentees: "Mentees",
};

export const SORT_LABELS: Record<MemberSort, string> = {
  az: "sort: A–Z",
  za: "sort: Z–A",
  recent: "sort: newest",
};

/** Cycles when the sort pill is clicked. */
export const NEXT_SORT: Record<MemberSort, MemberSort> = {
  az: "za",
  za: "recent",
  recent: "az",
};
