"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { MembersQuery } from "@/lib/members/query-params";

export function useMemberFilters(initialQuery: MembersQuery) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState(initialQuery.q || "");

  // Sync local input if the URL changes externally (e.g., browser back/forward)
  useEffect(() => {
    // Synchronize when navigation changes the URL externally.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTerm(initialQuery.q || "");
  }, [initialQuery.q]);

  // Push local changes to the URL after a 300ms debounce
  useEffect(() => {
    if (term === (initialQuery.q || "")) return;

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
