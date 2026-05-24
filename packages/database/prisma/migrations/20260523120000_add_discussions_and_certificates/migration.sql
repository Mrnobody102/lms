-- CreateEnum
CREATE TYPE "DiscussionTargetType" AS ENUM ('LESSON', 'PRACTICE_EXERCISE_SET');

-- CreateTable
CREATE TABLE "DiscussionThread" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetType" "DiscussionTargetType" NOT NULL,
    "lessonId" TEXT,
    "exerciseSetId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReply" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCertificate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "certificateCode" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionThread_id_tenantId_key" ON "DiscussionThread"("id", "tenantId");
CREATE INDEX "DiscussionThread_tenantId_targetType_lessonId_createdAt_idx" ON "DiscussionThread"("tenantId", "targetType", "lessonId", "createdAt");
CREATE INDEX "DiscussionThread_tenantId_targetType_exerciseSetId_createdAt_idx" ON "DiscussionThread"("tenantId", "targetType", "exerciseSetId", "createdAt");
CREATE INDEX "DiscussionThread_tenantId_authorId_createdAt_idx" ON "DiscussionThread"("tenantId", "authorId", "createdAt");
CREATE UNIQUE INDEX "DiscussionReply_id_tenantId_key" ON "DiscussionReply"("id", "tenantId");
CREATE INDEX "DiscussionReply_tenantId_threadId_createdAt_idx" ON "DiscussionReply"("tenantId", "threadId", "createdAt");
CREATE INDEX "DiscussionReply_tenantId_authorId_createdAt_idx" ON "DiscussionReply"("tenantId", "authorId", "createdAt");
CREATE UNIQUE INDEX "CourseCertificate_certificateCode_key" ON "CourseCertificate"("certificateCode");
CREATE UNIQUE INDEX "CourseCertificate_tenantId_userId_courseId_key" ON "CourseCertificate"("tenantId", "userId", "courseId");
CREATE UNIQUE INDEX "CourseCertificate_id_tenantId_key" ON "CourseCertificate"("id", "tenantId");
CREATE INDEX "CourseCertificate_tenantId_courseId_issuedAt_idx" ON "CourseCertificate"("tenantId", "courseId", "issuedAt");
CREATE INDEX "CourseCertificate_tenantId_userId_issuedAt_idx" ON "CourseCertificate"("tenantId", "userId", "issuedAt");

-- AddForeignKey
ALTER TABLE "DiscussionThread" ADD CONSTRAINT "DiscussionThread_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionThread" ADD CONSTRAINT "DiscussionThread_authorId_tenantId_fkey" FOREIGN KEY ("authorId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionThread" ADD CONSTRAINT "DiscussionThread_lessonId_tenantId_fkey" FOREIGN KEY ("lessonId", "tenantId") REFERENCES "Lesson"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionThread" ADD CONSTRAINT "DiscussionThread_exerciseSetId_tenantId_fkey" FOREIGN KEY ("exerciseSetId", "tenantId") REFERENCES "PracticeExerciseSet"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionReply" ADD CONSTRAINT "DiscussionReply_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionReply" ADD CONSTRAINT "DiscussionReply_threadId_tenantId_fkey" FOREIGN KEY ("threadId", "tenantId") REFERENCES "DiscussionThread"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionReply" ADD CONSTRAINT "DiscussionReply_authorId_tenantId_fkey" FOREIGN KEY ("authorId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseCertificate" ADD CONSTRAINT "CourseCertificate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseCertificate" ADD CONSTRAINT "CourseCertificate_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseCertificate" ADD CONSTRAINT "CourseCertificate_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
