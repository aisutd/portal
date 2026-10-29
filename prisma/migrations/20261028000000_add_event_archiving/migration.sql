ALTER TABLE "Event" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD CONSTRAINT "Event_archived_unpublished" CHECK (NOT "isArchived" OR NOT "isPublished");
