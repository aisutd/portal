"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function PasswordResetButton() {
  const { openUserProfile } = useClerk();

  return (
    <Button 
      variant="accent" 
      size="md" 
      pill={true} 
      className="font-black px-[24px]"
      onClick={() => openUserProfile()}
    >
      Reset Password
    </Button>
  );
}