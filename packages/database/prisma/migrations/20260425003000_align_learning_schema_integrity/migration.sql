-- Align migration history with the current learning schema and add tenant-scoped integrity.
-- This migration is intentionally defensive because older environments may have been created
-- with `prisma db push` before migrations were standardized.

DO $$ BEGIN
  CREATE TYPE "LessonType" AS ENUM ('video', 'text', 'quiz');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProgressStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "totalDuration" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LessonType" NOT NULL DEFAULT 'text',
    "content" TEXT,
    "videoUrl" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 10,
    "quiz" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserLessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserLessonProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_id_tenantId_key" ON "User"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Course_id_tenantId_key" ON "Course"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Lesson_id_tenantId_key" ON "Lesson"("id", "tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "Course_tenantId_slug_key" ON "Course"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "Course_tenantId_isActive_idx" ON "Course"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "Course_deletedAt_idx" ON "Course"("deletedAt");

CREATE INDEX IF NOT EXISTS "Lesson_courseId_idx" ON "Lesson"("courseId");
CREATE INDEX IF NOT EXISTS "Lesson_tenantId_type_idx" ON "Lesson"("tenantId", "type");
CREATE INDEX IF NOT EXISTS "Lesson_deletedAt_idx" ON "Lesson"("deletedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "UserLessonProgress_userId_lessonId_key" ON "UserLessonProgress"("userId", "lessonId");
CREATE INDEX IF NOT EXISTS "UserLessonProgress_userId_idx" ON "UserLessonProgress"("userId");
CREATE INDEX IF NOT EXISTS "UserLessonProgress_lessonId_idx" ON "UserLessonProgress"("lessonId");
CREATE INDEX IF NOT EXISTS "UserLessonProgress_tenantId_idx" ON "UserLessonProgress"("tenantId");

ALTER TABLE "Lesson" DROP CONSTRAINT IF EXISTS "Lesson_courseId_fkey";
ALTER TABLE "UserLessonProgress" DROP CONSTRAINT IF EXISTS "UserLessonProgress_userId_fkey";
ALTER TABLE "UserLessonProgress" DROP CONSTRAINT IF EXISTS "UserLessonProgress_lessonId_fkey";
ALTER TABLE "CourseEnrollment" DROP CONSTRAINT IF EXISTS "CourseEnrollment_userId_fkey";
ALTER TABLE "CourseEnrollment" DROP CONSTRAINT IF EXISTS "CourseEnrollment_courseId_fkey";

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lesson_tenantId_fkey') THEN
    ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lesson_courseId_tenantId_fkey') THEN
    ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserLessonProgress_userId_tenantId_fkey') THEN
    ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserLessonProgress_lessonId_tenantId_fkey') THEN
    ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_lessonId_tenantId_fkey" FOREIGN KEY ("lessonId", "tenantId") REFERENCES "Lesson"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CourseEnrollment_userId_tenantId_fkey') THEN
    ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CourseEnrollment_courseId_tenantId_fkey') THEN
    ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
