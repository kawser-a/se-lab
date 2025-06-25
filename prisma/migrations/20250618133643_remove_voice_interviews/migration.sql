/*
  Warnings:

  - You are about to drop the `InterviewTurn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VoiceInterview` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InterviewTurn" DROP CONSTRAINT "InterviewTurn_voiceInterviewId_fkey";

-- DropForeignKey
ALTER TABLE "VoiceInterview" DROP CONSTRAINT "VoiceInterview_userId_fkey";

-- DropTable
DROP TABLE "InterviewTurn";

-- DropTable
DROP TABLE "VoiceInterview";

-- DropEnum
DROP TYPE "Difficulty";

-- DropEnum
DROP TYPE "InterviewType";

-- DropEnum
DROP TYPE "TurnRole";
