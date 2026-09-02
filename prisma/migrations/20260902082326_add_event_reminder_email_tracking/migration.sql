-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "lastReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "lastReminderSentById" TEXT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_lastReminderSentById_fkey" FOREIGN KEY ("lastReminderSentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
