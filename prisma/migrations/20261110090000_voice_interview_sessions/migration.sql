-- The old table only stored finished interviews, with columns from the
-- ElevenLabs version that are no longer used. Interviews are now saved
-- while they happen, so the table is rebuilt. Rows from the old feature
-- can't be mapped to the new shape and are dropped.
DROP TABLE IF EXISTS "VoiceInterview";

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "VoiceInterview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "focus" TEXT[],
    "status" "InterviewStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "plan" JSONB NOT NULL,
    "turns" JSONB NOT NULL DEFAULT '[]',
    "score" DOUBLE PRECISION,
    "feedback" JSONB,
    "metrics" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceInterview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceInterview_userId_createdAt_idx" ON "VoiceInterview"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "VoiceInterview" ADD CONSTRAINT "VoiceInterview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
