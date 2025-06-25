-- CreateTable
CREATE TABLE "VoiceInterview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "techStack" TEXT[],
    "type" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT NOT NULL,
    "areasForImprovement" TEXT NOT NULL,
    "feedbackJson" JSONB NOT NULL,
    "transcriptJson" JSONB NOT NULL,
    "aiAudioUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceInterview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceInterview_userId_idx" ON "VoiceInterview"("userId");

-- AddForeignKey
ALTER TABLE "VoiceInterview" ADD CONSTRAINT "VoiceInterview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
