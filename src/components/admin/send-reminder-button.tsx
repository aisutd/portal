"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SendReminderButtonProps {
  eventId: string;
  eventTitle: string;
  rsvpCount: number;
}

export function SendReminderButton({
  eventId,
  eventTitle,
  rsvpCount,
}: SendReminderButtonProps) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false); // Replaces native confirm()

  const handleConfirmAndSend = async () => {
    setShowConfirm(false);
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/admin/events/${eventId}/send-reminder`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setStatusMsg(`Sent ${data.count ?? rsvpCount} reminder(s)!`);
      } else {
        setStatusMsg(data.error || "Failed to send reminders.");
      }
    } catch {
      setStatusMsg("An error occurred while sending.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-end gap-1">
      {!showConfirm ? (
        <Button
          variant="accent"
          size="sm"
          className="rounded-[8px] touch-manipulation"
          disabled={loading || rsvpCount === 0}
          onClick={() => {
            if (rsvpCount === 0) {
              setStatusMsg("No RSVPs found.");
              return;
            }
            setShowConfirm(true);
          }}
        >
          {loading ? "Sending..." : "Send Reminders"}
        </Button>
      ) : (
        /* Mobile-Friendly Confirmation UI */
        <div className="flex items-center gap-2 rounded-[8px] bg-white p-1 border border-border-soft shadow-md">
          <span className="text-xs text-ink font-medium px-1">
            Send to {rsvpCount}?
          </span>
          <Button
            variant="accent"
            size="sm"
            className="h-[28px] px-2 text-xs"
            disabled={loading}
            onClick={handleConfirmAndSend}
          >
            Confirm
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-[28px] px-2 text-xs"
            onClick={() => setShowConfirm(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {statusMsg && (
        <span className="text-xs text-ink-faint font-medium">
          {statusMsg}
        </span>
      )}
    </div>
  );
}