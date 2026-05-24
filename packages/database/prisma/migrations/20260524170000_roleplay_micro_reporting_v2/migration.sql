-- AlterEnum
ALTER TYPE "LearningActivityType" ADD VALUE 'MICRO_CARD_VIEWED';
ALTER TYPE "LearningActivityType" ADD VALUE 'MICRO_CARD_FLIPPED';
ALTER TYPE "LearningActivityType" ADD VALUE 'MICRO_CARD_COMPLETED';

-- CreateEnum
CREATE TYPE "RoleplayMode" AS ENUM ('TEXT', 'AUDIO', 'MIXED');

-- CreateEnum
CREATE TYPE "PronunciationAssessmentStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RiskFlagType" AS ENUM ('NO_ACTIVITY', 'FALLING_BEHIND', 'LOW_MASTERY', 'OVERDUE_SRS', 'DECLINING_SCORE');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "RoleplayScenario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetLanguage" TEXT NOT NULL DEFAULT 'zh-CN',
    "level" TEXT,
    "skillTags" TEXT[],
    "mode" "RoleplayMode" NOT NULL DEFAULT 'TEXT',
    "systemPrompt" TEXT NOT NULL,
    "openingMessage" TEXT,
    "rubric" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleplayScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PronunciationAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "status" "PronunciationAssessmentStatus" NOT NULL DEFAULT 'QUEUED',
    "transcript" TEXT,
    "expectedText" TEXT,
    "overallScore" INTEGER,
    "fluencyScore" INTEGER,
    "accuracyScore" INTEGER,
    "completenessScore" INTEGER,
    "wordScores" JSONB,
    "provider" TEXT,
    "rawProviderPayload" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PronunciationAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRiskSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "cohortId" TEXT,
    "severity" "RiskSeverity" NOT NULL,
    "score" INTEGER NOT NULL,
    "flags" "RiskFlagType"[],
    "reasons" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentRiskSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingRiskRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "RiskFlagType" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "config" JSONB NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportingRiskRule_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "RoleplaySession" ADD COLUMN "scenarioId" TEXT;
ALTER TABLE "RoleplaySession" ADD COLUMN "mode" "RoleplayMode" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "RoleplaySession" ADD COLUMN "pronunciationScore" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "RoleplayScenario_id_tenantId_key" ON "RoleplayScenario"("id", "tenantId");

-- CreateIndex
CREATE INDEX "RoleplayScenario_tenantId_courseId_isPublished_deletedAt_idx" ON "RoleplayScenario"("tenantId", "courseId", "isPublished", "deletedAt");

-- CreateIndex
CREATE INDEX "RoleplayScenario_tenantId_unitId_idx" ON "RoleplayScenario"("tenantId", "unitId");

-- CreateIndex
CREATE INDEX "RoleplaySession_tenantId_scenarioId_idx" ON "RoleplaySession"("tenantId", "scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "PronunciationAssessment_id_tenantId_key" ON "PronunciationAssessment"("id", "tenantId");

-- CreateIndex
CREATE INDEX "PronunciationAssessment_tenantId_sessionId_idx" ON "PronunciationAssessment"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "PronunciationAssessment_tenantId_status_createdAt_idx" ON "PronunciationAssessment"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "StudentRiskSnapshot_tenantId_computedAt_idx" ON "StudentRiskSnapshot"("tenantId", "computedAt");

-- CreateIndex
CREATE INDEX "StudentRiskSnapshot_tenantId_courseId_severity_idx" ON "StudentRiskSnapshot"("tenantId", "courseId", "severity");

-- CreateIndex
CREATE INDEX "StudentRiskSnapshot_tenantId_cohortId_severity_idx" ON "StudentRiskSnapshot"("tenantId", "cohortId", "severity");

-- CreateIndex
CREATE INDEX "StudentRiskSnapshot_tenantId_userId_computedAt_idx" ON "StudentRiskSnapshot"("tenantId", "userId", "computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingRiskRule_tenantId_type_key" ON "ReportingRiskRule"("tenantId", "type");

-- CreateIndex
CREATE INDEX "ReportingRiskRule_tenantId_isEnabled_idx" ON "ReportingRiskRule"("tenantId", "isEnabled");

-- AddForeignKey
ALTER TABLE "RoleplayScenario" ADD CONSTRAINT "RoleplayScenario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleplayScenario" ADD CONSTRAINT "RoleplayScenario_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleplayScenario" ADD CONSTRAINT "RoleplayScenario_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "CourseUnit"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleplaySession" ADD CONSTRAINT "RoleplaySession_scenarioId_tenantId_fkey" FOREIGN KEY ("scenarioId", "tenantId") REFERENCES "RoleplayScenario"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PronunciationAssessment" ADD CONSTRAINT "PronunciationAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PronunciationAssessment" ADD CONSTRAINT "PronunciationAssessment_sessionId_tenantId_fkey" FOREIGN KEY ("sessionId", "tenantId") REFERENCES "RoleplaySession"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PronunciationAssessment" ADD CONSTRAINT "PronunciationAssessment_messageId_tenantId_fkey" FOREIGN KEY ("messageId", "tenantId") REFERENCES "RoleplayMessage"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PronunciationAssessment" ADD CONSTRAINT "PronunciationAssessment_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRiskSnapshot" ADD CONSTRAINT "StudentRiskSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRiskSnapshot" ADD CONSTRAINT "StudentRiskSnapshot_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingRiskRule" ADD CONSTRAINT "ReportingRiskRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
