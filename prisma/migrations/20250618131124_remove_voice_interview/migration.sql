/*
  Warnings:

  - You are about to drop the `VoiceInterview` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VoiceInterview" DROP CONSTRAINT "VoiceInterview_userId_fkey";

-- DropTable
DROP TABLE "VoiceInterview";

-- DropEnum
DROP TYPE "Difficulty";

-- DropEnum
DROP TYPE "InterviewType";
