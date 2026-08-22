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
          <Button variant="ghost" size="sm" className="rounded-[8px]" disabled>
            ‹ Prev
          </Button>
        )}

        {pageWindow(page, pageCount).map((n) =>
          n === page ? (
            <span key={n} aria-current="page">
              <Badge label={String(n)} bg="#e1e8ff" color="#1f3aa3" />
            </span>
          ) : (
            <Link
              key={n}
              href={membersHref(query, { page: n })}
              aria-label={`Page ${n}`}
              className="rounded-full transition-colors hover:[&>span]:border-brand hover:[&>span]:bg-brand-soft hover:[&>span]:text-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-soft"
            >
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
          <Button variant="ghost" size="sm" className="rounded-[8px]" disabled>
            Next ›
          </Button>
        )}
      </div>
    </div>
  );
}
