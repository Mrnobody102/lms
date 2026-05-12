-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExamQuestionType" ADD VALUE 'AI_EVALUATED_AUDIO';
ALTER TYPE "ExamQuestionType" ADD VALUE 'AI_EVALUATED_TEXT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LessonType" ADD VALUE 'simulation';
ALTER TYPE "LessonType" ADD VALUE 'micro_card';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PracticeQuestionType" ADD VALUE 'AI_EVALUATED_AUDIO';
ALTER TYPE "PracticeQuestionType" ADD VALUE 'AI_EVALUATED_TEXT';

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

-- DropIndex
DROP INDEX "Course_deletedAt_idx";

-- DropIndex
DROP INDEX "Lesson_deletedAt_idx";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "aiSettings" JSONB,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CourseUnit" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExamAnswer" ADD COLUMN     "aiFeedback" JSONB;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "aiPrompt" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PracticeAnswer" ADD COLUMN     "aiFeedback" JSONB;

-- AlterTable
ALTER TABLE "UserLessonProgress" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Course_tenantId_deletedAt_idx" ON "Course"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Lesson_tenantId_deletedAt_idx" ON "Lesson"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Tenant_isActive_idx" ON "Tenant"("isActive");

-- CreateIndex
CREATE INDEX "User_tenantId_deletedAt_idx" ON "User"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
