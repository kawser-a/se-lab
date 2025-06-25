-- CreateTable
CREATE TABLE "VoiceInterview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interviewType" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "topic" TEXT,
    "transcript" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceInterview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceInterview_userId_idx" ON "VoiceInterview"("userId");

-- AddForeignKey
ALTER TABLE "VoiceInterview" ADD CONSTRAINT "VoiceInterview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
