import { cache } from "react";
import { getAuthenticatedUser } from "@/lib/auth";

/** What the navbar needs about the signed-in user, resolved on the server. */
export type NavAccount = {
  /** Preferred name if set, else the legal first name. */
  firstName: string | null;
  role: string | null;
};

/**
 * Read by the root layout so the navbar can render the name in the initial
 * HTML — fetching it client-side made the label flash "Profile" first.
 * Cached per request; never throws, since a failure here would 500 every page.
 */
export const getNavAccount = cache(async function getNavAccount(): Promise<NavAccount | null> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const profile = user.profile;

    return {
      firstName: profile ? profile.prefName || profile.firstName : null,
      role: user.role,
    };
  } catch {
    return null;
  }
});
