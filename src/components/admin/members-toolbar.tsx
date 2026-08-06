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
