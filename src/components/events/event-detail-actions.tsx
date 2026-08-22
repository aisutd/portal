"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

interface EventQRCodeProps {
    value: string;
}

export function EventQRCode({ value }: EventQRCodeProps) {
    return (
        <div className="flex size-[180px] items-center justify-center rounded-[10px] bg-white p-3 shadow-xs border border-border-soft">
            <QRCode
                value={value}
                size={150}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 150 150`}
            />
        </div>
    );
}

export function EventDetailActions({ eventId, initialRsvpd }: { eventId: string; initialRsvpd: boolean }) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [isRsvpd, setIsRsvpd] = useState(initialRsvpd);
  const [loading, setLoading] = useState(false);

  async function handleRsvpToggle() {
    if (!isSignedIn) {
      router.push("/onboarding?mode=login");
      return;
    }

    setLoading(true);
    const method = isRsvpd ? "DELETE" : "POST";

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, { method });
      if (res.ok) {
        setIsRsvpd(!isRsvpd);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-[10px] mt-[4px]">
      <Button 
        variant={isRsvpd ? "accent" : "primary"} 
        size="md" 
        onClick={handleRsvpToggle}
        disabled={loading}
        block
      >
        {loading ? "Processing..." : isRsvpd ? "Cancel RSVP" : "RSVP Now"}
      </Button>
    </div>
  );
}