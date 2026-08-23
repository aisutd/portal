-- Which programs an event counts toward, for the member status calculation.
-- Existing events default to the empty array, i.e. general events that count
-- for every member regardless of program.
ALTER TABLE "Event"
  ADD COLUMN "programs" "MembershipType"[] NOT NULL DEFAULT ARRAY[]::"MembershipType"[];
