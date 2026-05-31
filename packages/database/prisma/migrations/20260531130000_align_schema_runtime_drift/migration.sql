-- Align migration history with schema fields already used by runtime code and seed data.

-- AlterEnum
ALTER TYPE "PracticeQuestionType" ADD VALUE IF NOT EXISTS 'MATCHING' AFTER 'AI_EVALUATED_TEXT';
ALTER TYPE "PracticeQuestionType" ADD VALUE IF NOT EXISTS 'ORDERING' AFTER 'MATCHING';
ALTER TYPE "ExamQuestionType" ADD VALUE IF NOT EXISTS 'MATCHING' AFTER 'AI_EVALUATED_TEXT';
ALTER TYPE "ExamQuestionType" ADD VALUE IF NOT EXISTS 'ORDERING' AFTER 'MATCHING';
ALTER TYPE "MarketplaceResourceType" ADD VALUE IF NOT EXISTS 'EXAM' AFTER 'COURSE';
ALTER TYPE "MarketplaceResourceType" ADD VALUE IF NOT EXISTS 'PRACTICE_EXERCISE_SET' AFTER 'EXAM';
ALTER TYPE "ReviewCardSource" ADD VALUE IF NOT EXISTS 'CUSTOM' AFTER 'EXAM_QUESTION';

-- AlterTable
ALTER TABLE "AiGeneratedQuestionDraft" ALTER COLUMN "courseId" DROP NOT NULL;
ALTER TABLE "AiQuestionGenerationJob" ALTER COLUMN "courseId" DROP NOT NULL;
ALTER TABLE "Exam" ALTER COLUMN "courseId" DROP NOT NULL;
ALTER TABLE "ExamAttempt" ALTER COLUMN "courseId" DROP NOT NULL;
ALTER TABLE "PracticeAttempt" ALTER COLUMN "courseId" DROP NOT NULL;
ALTER TABLE "PracticeExerciseSet" ALTER COLUMN "courseId" DROP NOT NULL;
ALTER TABLE "PracticeQuestion" ALTER COLUMN "courseId" DROP NOT NULL;
ALTER TABLE "RoleplayScenario" ALTER COLUMN "courseId" DROP NOT NULL;

UPDATE "Lesson"
SET "content" = "quiz"::text
WHERE "quiz" IS NOT NULL
  AND "content" IS NULL;

ALTER TABLE "Lesson" DROP COLUMN IF EXISTS "quiz";

ALTER TABLE "ReviewCard" ADD COLUMN "customContent" JSONB;

ALTER TABLE "User" ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastActiveDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "grade" "ReviewCardGrade" NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL,
    "interval" INTEGER NOT NULL,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageQuota" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestsUsed" INTEGER NOT NULL DEFAULT 0,
    "requestLimit" INTEGER NOT NULL DEFAULT 50,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillMasterySnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillCode" TEXT NOT NULL,
    "mastery" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillMasterySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "actionUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewLog_tenantId_userId_createdAt_idx" ON "ReviewLog"("tenantId", "userId", "createdAt");
CREATE INDEX "ReviewLog_cardId_idx" ON "ReviewLog"("cardId");
CREATE UNIQUE INDEX "AiUsageQuota_tenantId_userId_key" ON "AiUsageQuota"("tenantId", "userId");
CREATE INDEX "SkillMasterySnapshot_tenantId_skillCode_date_idx" ON "SkillMasterySnapshot"("tenantId", "skillCode", "date");
CREATE UNIQUE INDEX "SkillMasterySnapshot_tenantId_userId_skillCode_date_key" ON "SkillMasterySnapshot"("tenantId", "userId", "skillCode", "date");
CREATE UNIQUE INDEX "Notification_id_tenantId_key" ON "Notification"("id", "tenantId");
CREATE INDEX "Notification_tenantId_userId_readAt_idx" ON "Notification"("tenantId", "userId", "readAt");

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "ReviewCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiUsageQuota" ADD CONSTRAINT "AiUsageQuota_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiUsageQuota" ADD CONSTRAINT "AiUsageQuota_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillMasterySnapshot" ADD CONSTRAINT "SkillMasterySnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillMasterySnapshot" ADD CONSTRAINT "SkillMasterySnapshot_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillMasterySnapshot" ADD CONSTRAINT "SkillMasterySnapshot_tenantId_skillCode_fkey" FOREIGN KEY ("tenantId", "skillCode") REFERENCES "Skill"("tenantId", "code") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX IF EXISTS "DiscussionThread_tenantId_targetType_exerciseSetId_createdAt_id" RENAME TO "DiscussionThread_tenantId_targetType_exerciseSetId_createdA_idx";
ALTER INDEX IF EXISTS "InstructorSpecialty_tenantId_instructorId_subject_languageCode_" RENAME TO "InstructorSpecialty_tenantId_instructorId_subject_languageC_key";
