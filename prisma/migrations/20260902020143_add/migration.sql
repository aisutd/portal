-- AlterTable
ALTER TABLE "ProgramApplication" ADD COLUMN     "eligibility" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "roles" TEXT[] DEFAULT ARRAY[]::TEXT[];
