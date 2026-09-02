ALTER TABLE "ApplicationReview" ADD COLUMN "score" INTEGER;

CREATE UNIQUE INDEX "ApplicationReview_submissionId_reviewerId_key"
ON "ApplicationReview"("submissionId", "reviewerId");

ALTER TABLE "ProgramApplication" ADD COLUMN "questionsJson" JSONB;
