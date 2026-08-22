"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function PasswordResetButton() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [leaving, setLeaving] = useState(false);

  const handleClick = async () => {
    setLeaving(true);

    // Read the address before signing out, which clears `user`.
    const email = user?.primaryEmailAddress?.emailAddress;
    const target = email
      ? `/onboarding?mode=reset&email=${encodeURIComponent(email)}`
      : "/onboarding?mode=reset";

    await signOut({ redirectUrl: target });
  };

  return (
    <Button
      // The profile form wraps this card; without an explicit type the button
      // would submit it.
      type="button"
      variant="accent"
      size="md"
      pill
      className="font-black px-[24px]"
      onClick={handleClick}
      disabled={leaving}
    >
      {leaving ? "Redirecting…" : "Reset Password"}
    </Button>
  );
}
