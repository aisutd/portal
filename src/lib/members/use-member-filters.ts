"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { membersHref, type MembersQuery } from "@/lib/members/query-params";

export function useMemberFilters(initialQuery: MembersQuery) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState(initialQuery.q);
  const [syncedQ, setSyncedQ] = useState(initialQuery.q);

  if (initialQuery.q !== syncedQ) {
    setSyncedQ(initialQuery.q);
    setTerm(initialQuery.q);
  }

  useEffect(() => {
    if (term === initialQuery.q) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) params.set("q", term);
      else params.delete("q");
      params.set("page", "1");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [term, initialQuery.q, router, pathname, searchParams]);

  return { term, setTerm, isPending };
}