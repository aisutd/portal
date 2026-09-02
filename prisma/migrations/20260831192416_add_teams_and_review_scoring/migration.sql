/*
  Warnings:

  - You are about to drop the column `score` on the `ApplicationReview` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TEAM" AS ENUM ('AI_ACADEMY', 'AI_INNOVATION', 'AIM', 'MARKETING', 'OPERATIONS', 'FINANCE', 'INDUSTRY', 'TECHNOLOGY', 'EXECUTIVE');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'DIRECTOR';

-- AlterTable
ALTER TABLE "ApplicationReview" DROP COLUMN "score";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "team" "TEAM";
