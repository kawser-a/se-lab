-- Insights now describe one industry in one country's job market, with
-- salaries in that country's currency. Existing rows were US-centric.
-- Users are no longer linked to an insight row by a foreign key: insights
-- are looked up by industry and country, so a profile can be saved before
-- the AI has written them.

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_industry_fkey";

-- DropIndex
DROP INDEX "IndustryInsight_industry_key";
DROP INDEX "IndustryInsight_industry_idx";

-- AlterTable
ALTER TABLE "IndustryInsight" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN "summary" TEXT,
ADD COLUMN "skillDemand" JSONB[] DEFAULT ARRAY[]::JSONB[],
ADD COLUMN "trends" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN "country" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "IndustryInsight_industry_country_key" ON "IndustryInsight"("industry", "country");
CREATE INDEX "User_industry_country_idx" ON "User"("industry", "country");
CREATE INDEX "IndustryInsight_nextUpdate_idx" ON "IndustryInsight"("nextUpdate");
