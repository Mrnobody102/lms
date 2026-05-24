-- CreateEnum
CREATE TYPE "AiGenerationJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiDraftReviewStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "AiQuestionGenerationJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "topic" TEXT NOT NULL,
    "context" TEXT,
    "questionType" "PracticeQuestionType" NOT NULL,
    "requestedCount" INTEGER NOT NULL,
    "skillTags" TEXT[],
    "status" "AiGenerationJobStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT,
    "model" TEXT,
    "promptVersion" TEXT NOT NULL,
    "promptHash" TEXT,
    "sourceReason" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiQuestionGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGeneratedQuestionDraft" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "type" "PracticeQuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB NOT NULL,
    "explanation" TEXT,
    "skillTags" TEXT[],
    "difficulty" TEXT,
    "rawProviderPayload" JSONB,
    "validationIssues" JSONB,
    "reviewStatus" "AiDraftReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "approvedQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiGeneratedQuestionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiQuestionGenerationJob_id_tenantId_key" ON "AiQuestionGenerationJob"("id", "tenantId");

-- CreateIndex
CREATE INDEX "AiQuestionGenerationJob_tenantId_status_createdAt_idx" ON "AiQuestionGenerationJob"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiQuestionGenerationJob_tenantId_courseId_createdAt_idx" ON "AiQuestionGenerationJob"("tenantId", "courseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiGeneratedQuestionDraft_id_tenantId_key" ON "AiGeneratedQuestionDraft"("id", "tenantId");

-- CreateIndex
CREATE INDEX "AiGeneratedQuestionDraft_tenantId_reviewStatus_createdAt_idx" ON "AiGeneratedQuestionDraft"("tenantId", "reviewStatus", "createdAt");

-- CreateIndex
CREATE INDEX "AiGeneratedQuestionDraft_tenantId_jobId_idx" ON "AiGeneratedQuestionDraft"("tenantId", "jobId");

-- CreateIndex
CREATE INDEX "AiGeneratedQuestionDraft_tenantId_courseId_unitId_idx" ON "AiGeneratedQuestionDraft"("tenantId", "courseId", "unitId");

-- AddForeignKey
ALTER TABLE "AiQuestionGenerationJob" ADD CONSTRAINT "AiQuestionGenerationJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuestionGenerationJob" ADD CONSTRAINT "AiQuestionGenerationJob_requestedById_tenantId_fkey" FOREIGN KEY ("requestedById", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuestionGenerationJob" ADD CONSTRAINT "AiQuestionGenerationJob_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuestionGenerationJob" ADD CONSTRAINT "AiQuestionGenerationJob_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "CourseUnit"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedQuestionDraft" ADD CONSTRAINT "AiGeneratedQuestionDraft_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedQuestionDraft" ADD CONSTRAINT "AiGeneratedQuestionDraft_jobId_tenantId_fkey" FOREIGN KEY ("jobId", "tenantId") REFERENCES "AiQuestionGenerationJob"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedQuestionDraft" ADD CONSTRAINT "AiGeneratedQuestionDraft_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedQuestionDraft" ADD CONSTRAINT "AiGeneratedQuestionDraft_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "CourseUnit"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedQuestionDraft" ADD CONSTRAINT "AiGeneratedQuestionDraft_reviewedById_tenantId_fkey" FOREIGN KEY ("reviewedById", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedQuestionDraft" ADD CONSTRAINT "AiGeneratedQuestionDraft_approvedQuestionId_tenantId_fkey" FOREIGN KEY ("approvedQuestionId", "tenantId") REFERENCES "PracticeQuestion"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;
