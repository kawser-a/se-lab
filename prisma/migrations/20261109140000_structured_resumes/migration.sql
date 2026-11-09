-- Resumes move from one Markdown document per user to any number of
-- structured CVs. The old Markdown content can't be mapped to the new
-- shape reliably, so existing rows are removed.
DELETE FROM "Resume";

-- DropForeignKey
ALTER TABLE "Resume" DROP CONSTRAINT "Resume_userId_fkey";

-- DropIndex
DROP INDEX "Resume_userId_key";

-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "content",
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "theme" JSONB NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'My CV';

-- CreateIndex
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
