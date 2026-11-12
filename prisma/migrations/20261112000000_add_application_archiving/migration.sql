ALTER TABLE "ProgramApplication" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProgramApplication" ADD CONSTRAINT "ProgramApplication_archived_hidden" CHECK (NOT "isArchived" OR NOT "visibleToUsers");
