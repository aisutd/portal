-- Role model rework.
--
-- UserRole collapses REVIEWER and ORGANIZER into OFFICER (they already granted
-- identical access everywhere) and renames SUPER_ADMIN to EXECUTIVE.
-- MembershipType renames two values and drops two that were never written.
--
-- Written by hand rather than generated: Prisma's generated SQL for an enum
-- change drops and recreates the type, which would blank the column. Postgres
-- also has no DROP VALUE, so both types are rebuilt and swapped.

-- ---------------------------------------------------------------------------
-- UserRole
-- ---------------------------------------------------------------------------
CREATE TYPE "UserRole_new" AS ENUM ('MEMBER', 'OFFICER', 'EXECUTIVE');

-- A column default blocks the USING cast below.
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE "role"::text
    WHEN 'REVIEWER'    THEN 'OFFICER'
    WHEN 'ORGANIZER'   THEN 'OFFICER'
    WHEN 'SUPER_ADMIN' THEN 'EXECUTIVE'
    ELSE 'MEMBER'
  END
)::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- ---------------------------------------------------------------------------
-- MembershipType
-- ---------------------------------------------------------------------------
-- NON_MEMBER and ALUMNUS are being removed. Abort rather than destroy data if
-- anything is using them by the time this runs.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Membership" WHERE "membershipType"::text IN ('NON_MEMBER', 'ALUMNUS')
  ) THEN
    RAISE EXCEPTION 'Membership rows still use NON_MEMBER or ALUMNUS - migrate them before running this';
  END IF;
END $$;

CREATE TYPE "MembershipType_new" AS ENUM ('AIM_MENTOR', 'AIM_MENTEE', 'AI_ACADEMY', 'INNOVATION_LABS');

ALTER TABLE "Membership" ALTER COLUMN "membershipType" TYPE "MembershipType_new" USING (
  CASE "membershipType"::text
    WHEN 'AI_STUDENT'   THEN 'AI_ACADEMY'
    WHEN 'AI_INNOVATOR' THEN 'INNOVATION_LABS'
    ELSE "membershipType"::text
  END
)::"MembershipType_new";

DROP TYPE "MembershipType";
ALTER TYPE "MembershipType_new" RENAME TO "MembershipType";
