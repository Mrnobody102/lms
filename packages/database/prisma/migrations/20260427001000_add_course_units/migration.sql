-- Add a course unit/chapter layer while preserving existing Course -> Lesson data.

CREATE TABLE "CourseUnit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseUnit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lesson" ADD COLUMN "unitId" TEXT;

CREATE UNIQUE INDEX "CourseUnit_id_tenantId_key" ON "CourseUnit"("id", "tenantId");
CREATE INDEX "CourseUnit_tenantId_courseId_deletedAt_idx" ON "CourseUnit"("tenantId", "courseId", "deletedAt");
CREATE INDEX "CourseUnit_courseId_order_idx" ON "CourseUnit"("courseId", "order");
CREATE INDEX "Lesson_unitId_idx" ON "Lesson"("unitId");

ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "CourseUnit" ("id", "title", "description", "order", "tenantId", "courseId", "createdAt", "updatedAt")
SELECT
  'default-unit-' || "Course"."id",
  'General',
  'Migrated default unit for existing lessons.',
  0,
  "Course"."tenantId",
  "Course"."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Course"
WHERE "Course"."deletedAt" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "Lesson"
    WHERE "Lesson"."courseId" = "Course"."id"
      AND "Lesson"."tenantId" = "Course"."tenantId"
      AND "Lesson"."deletedAt" IS NULL
  )
ON CONFLICT ("id") DO NOTHING;

UPDATE "Lesson"
SET "unitId" = 'default-unit-' || "courseId"
WHERE "unitId" IS NULL
  AND "deletedAt" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "CourseUnit"
    WHERE "CourseUnit"."id" = 'default-unit-' || "Lesson"."courseId"
      AND "CourseUnit"."tenantId" = "Lesson"."tenantId"
  );

ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "CourseUnit"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;
