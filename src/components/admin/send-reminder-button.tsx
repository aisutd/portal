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

  const handleSendReminder = async () => {
    if (rsvpCount === 0) {
      alert("There are no RSVPs to send reminders to.");
      return;
    }

    const confirmSend = confirm(
      `Send reminder emails to all ${rsvpCount} user(s) registered for "${eventTitle}"?`
    );
    if (!confirmSend) return;

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
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="accent"
        size="sm"
        className="rounded-[8px]"
        disabled={loading || rsvpCount === 0}
        onClick={handleSendReminder}
      >
        {loading ? "Sending..." : "Send Reminders"}
      </Button>
      {statusMsg && (
        <span className="text-xs text-ink-faint font-medium">
          {statusMsg}
        </span>
      )}
    </div>
  );
}