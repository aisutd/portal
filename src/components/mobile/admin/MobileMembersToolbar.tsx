"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { membersHref, type MemberFilter, type MembersQuery } from "@/lib/members/query-params";
import { FILTER_LABELS, NEXT_SORT, SORT_LABELS } from "@/lib/members/labels";
import { useMemberFilters } from "@/lib/members/use-member-filters";

/** Mobile counterpart of MembersToolbar: same URL contract, stacked layout. */
export function MobileMembersToolbar({ query }: { query: MembersQuery }) {
  const { term, setTerm, isPending } = useMemberFilters(query);

  return (
    <div className={`flex flex-col gap-[10px] ${isPending ? "opacity-70 transition-opacity" : ""}`}>
      <SearchInput
        value={term}
        onChange={setTerm}
        placeholder="Search name, NetID or email…"
        aria-label="Search members"
        className="h-[40px] w-full"
      />
      <div className="-mx-[20px] flex items-center gap-[8px] overflow-x-auto px-[20px]">
        {(Object.keys(FILTER_LABELS) as MemberFilter[]).map((filter) => (
          <Link key={filter} href={membersHref(query, { filter, page: 1 })} className="shrink-0">
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
          className="shrink-0"
        >
          <Badge label={SORT_LABELS[query.sort]} variant="outline" />
        </Link>
      </div>
    </div>
  );
}