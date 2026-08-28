"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EventActionButtonsProps {
  isPublished: boolean;
}

export function EventActionButtons({ isPublished }: EventActionButtonsProps) {
  const handlePublishClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const confirmed = window.confirm(
      "Are you sure you want to publish? This will be visible to all users if so."
    );
    if (!confirmed) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex gap-[10px]">
        <Button 
          type="submit" 
          name="action" 
          value="draft" 
          variant="ghost" 
          size="md" 
          className="flex-1"
        >
          Save changes
        </Button>

        {isPublished ? (
          <Button 
            type="submit" 
            name="action" 
            value="unpublish" 
            variant="accent" 
            size="md"
            className="flex-1"
          >
            Unpublish
          </Button>
        ) : (
          <Button 
            type="submit" 
            name="action" 
            value="publish" 
            variant="primary" 
            size="md"
            className="flex-1"
            onClick={handlePublishClick}
          >
            Publish
          </Button>
        )}
      </div>

      <Link href="/admin/events" className="w-full">
        <Button type="button" variant="ghost" size="md" className="w-full text-ink-faint">
          Cancel
        </Button>
      </Link>
    </div>
  );
}