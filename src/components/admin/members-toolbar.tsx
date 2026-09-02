"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { membersHref, type MemberFilter, type MembersQuery } from "@/lib/members/query-params";
import { FILTER_LABELS, NEXT_SORT, SORT_LABELS } from "@/lib/members/labels";
import { useMemberFilters } from "@/lib/members/use-member-filters";

export function MembersToolbar({ query }: { query: MembersQuery }) {
  const { term, setTerm, isPending } = useMemberFilters(query);

  return (
    <div className={`flex w-full items-center gap-[12px] ${isPending ? "opacity-70 transition-opacity" : ""}`}>
      <SearchInput
        value={term}
        onChange={setTerm}
        placeholder="Search name, NetID or email…"
        aria-label="Search members"
        className="h-[42px] flex-1"
      />

      {(Object.keys(FILTER_LABELS) as MemberFilter[]).map((filter) => (
        <Link key={filter} href={membersHref(query, { filter, page: 1 })}>
          <Button
            variant={query.filter === filter ? "soft" : "ghost"}
            size="sm"
            className="rounded-[8px]"
          >
            {FILTER_LABELS[filter]}
          </Button>
        </Link>
      ))}

      <Link
        href={membersHref(query, { sort: NEXT_SORT[query.sort] })}
        aria-label="Change sort"
        className="rounded-full transition-colors hover:[&>span]:border-brand hover:[&>span]:bg-brand-soft hover:[&>span]:text-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-soft"
      >
        <Badge label={SORT_LABELS[query.sort]} variant="outline" />
      </Link>
    </div>
  );
}