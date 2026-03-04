-- Add read status to messages
ALTER TABLE "Message"
ADD COLUMN "readAt" DATETIME;
