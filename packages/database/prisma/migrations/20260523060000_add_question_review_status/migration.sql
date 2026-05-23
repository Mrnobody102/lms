-- CreateEnum
CREATE TYPE "QuestionReviewStatus" AS ENUM ('APPROVED', 'PENDING_REVIEW', 'REJECTED');

-- AlterTable: add aiGenerated flag and reviewStatus to PracticeQuestion
-- Default APPROVED so existing questions keep working without a backfill.
ALTER TABLE "PracticeQuestion" ADD COLUMN "aiGenerated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PracticeQuestion" ADD COLUMN "reviewStatus" "QuestionReviewStatus" NOT NULL DEFAULT 'APPROVED';
