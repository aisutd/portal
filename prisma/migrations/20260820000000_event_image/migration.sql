-- Add an optional cover image for events and keep the existing event list working when no image is attached.
ALTER TABLE "Event"
  ADD COLUMN "imageUrl" TEXT;
