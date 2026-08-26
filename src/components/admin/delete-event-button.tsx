"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

interface DeleteEventButtonProps {
  eventId: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
}

export function DeleteEventButton({ eventId, deleteAction }: DeleteEventButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this event? All associated RSVPs and data will be permanently removed.")) {
      const formData = new FormData();
      formData.append("id", eventId);
      
      startTransition(async () => {
        try {
          await deleteAction(formData);
        } catch (error) {
          alert("Failed to delete event. Please try again.");
        }
      });
    }
  };

  return (
    <Button 
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      variant="ghost" 
      size="md" 
      className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      {isPending ? "Deleting..." : "Delete Event"}
    </Button>
  );
}