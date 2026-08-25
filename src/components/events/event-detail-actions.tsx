"use client";

import { useState, useEffect, useCallback } from "react";
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

export function EventDetailActions({
  eventId,
  initialRsvpd,
}: {
  eventId: string;
  initialRsvpd: boolean;
}) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isRsvpd, setIsRsvpd] = useState(initialRsvpd);
  const [loading, setLoading] = useState(false);

  // Synchronize state if props update from router.refresh()
  useEffect(() => {
    setIsRsvpd(initialRsvpd);
  }, [initialRsvpd]);

  const executeRsvp = useCallback(
    async (method: "POST" | "DELETE") => {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}/rsvp`, { method });
        if (res.ok) {
          setIsRsvpd(method === "POST");
          router.refresh();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [eventId, router]
  );

  // Check for pending RSVP cookie post-login
  useEffect(() => {
    if (!isLoaded || !isSignedIn || isRsvpd) return;

    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("pending_rsvp_event_id="));

    const pendingId = match?.split("=")[1];

    if (pendingId === eventId) {
      // Clear cookie immediately so it only executes once
      document.cookie =
        "pending_rsvp_event_id=; path=/; max-age=0; SameSite=Lax";
      executeRsvp("POST");
    }
  }, [isLoaded, isSignedIn, isRsvpd, eventId, executeRsvp]);

  async function handleRsvpToggle() {
    if (!isSignedIn) {
      // 1. Save event ID to cookie
      document.cookie = `pending_rsvp_event_id=${eventId}; path=/; max-age=600; SameSite=Lax`;

      // 2. Redirect to onboarding/login with redirectUrl back to the event
      const returnUrl = encodeURIComponent(`/events/${eventId}`);
      router.push(`/onboarding?mode=login&redirect_url=${returnUrl}`);
      return;
    }

    const method = isRsvpd ? "DELETE" : "POST";
    await executeRsvp(method);
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