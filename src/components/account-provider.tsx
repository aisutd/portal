"use client";

import { createContext, useContext } from "react";
import type { NavAccount } from "@/lib/nav-account";

const AccountContext = createContext<NavAccount | null>(null);

/**
 * Carries the server-resolved account down to client components (the navbar)
 * so they render the real name on the first paint instead of a placeholder.
 */
export function AccountProvider({
  account,
  children,
}: {
  account: NavAccount | null;
  children: React.ReactNode;
}) {
  return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  return useContext(AccountContext);
}
