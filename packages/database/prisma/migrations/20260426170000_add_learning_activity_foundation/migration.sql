DO $$ BEGIN
  CREATE TYPE "LearningActivityType" AS ENUM ('LESSON_OPENED', 'LESSON_COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "LearningActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "LearningActivityType" NOT NULL,
    "timeSpentSeconds" INTEGER,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LearningActivity_userId_occurredAt_idx" ON "LearningActivity"("userId", "occurredAt");
CREATE INDEX IF NOT EXISTS "LearningActivity_tenantId_occurredAt_idx" ON "LearningActivity"("tenantId", "occurredAt");
CREATE INDEX IF NOT EXISTS "LearningActivity_courseId_occurredAt_idx" ON "LearningActivity"("courseId", "occurredAt");
CREATE INDEX IF NOT EXISTS "LearningActivity_lessonId_occurredAt_idx" ON "LearningActivity"("lessonId", "occurredAt");
CREATE INDEX IF NOT EXISTS "LearningActivity_userId_lessonId_type_occurredAt_idx" ON "LearningActivity"("userId", "lessonId", "type", "occurredAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LearningActivity_userId_tenantId_fkey') THEN
    ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LearningActivity_tenantId_fkey') THEN
    ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LearningActivity_courseId_tenantId_fkey') THEN
    ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LearningActivity_lessonId_tenantId_fkey') THEN
    ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_lessonId_tenantId_fkey" FOREIGN KEY ("lessonId", "tenantId") REFERENCES "Lesson"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
