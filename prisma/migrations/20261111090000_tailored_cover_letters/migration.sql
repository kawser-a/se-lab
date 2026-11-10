-- Letters now remember which CV and settings they were written with, and
-- what the job asked for, so they can be revised later.
ALTER TABLE "CoverLetter" DROP CONSTRAINT "CoverLetter_userId_fkey";

DROP INDEX "CoverLetter_userId_idx";

ALTER TABLE "CoverLetter" ADD COLUMN     "resumeId" TEXT,
ADD COLUMN     "hiringManager" TEXT,
ADD COLUMN     "tone" TEXT NOT NULL DEFAULT 'confident',
ADD COLUMN     "length" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "requirements" JSONB[] DEFAULT ARRAY[]::JSONB[];

CREATE INDEX "CoverLetter_userId_updatedAt_idx" ON "CoverLetter"("userId", "updatedAt");

ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
