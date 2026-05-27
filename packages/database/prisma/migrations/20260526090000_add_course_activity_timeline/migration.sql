-- Add course-first activity timeline and activity-level student progress.

CREATE TYPE "CourseActivityType" AS ENUM ('LESSON', 'PRACTICE', 'EXAM', 'ROLEPLAY');
CREATE TYPE "CourseActivityCompletionPolicy" AS ENUM (
  'MANUAL',
  'LESSON_COMPLETED',
  'PRACTICE_SUBMITTED',
  'EXAM_SUBMITTED',
  'ROLEPLAY_COMPLETED'
);
CREATE TYPE "CourseActivityProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE "CourseActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "type" "CourseActivityType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 0,
    "availableFrom" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "unlockPolicy" JSONB,
    "completionPolicy" "CourseActivityCompletionPolicy" NOT NULL DEFAULT 'MANUAL',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserCourseActivityProgress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "status" "CourseActivityProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "scorePercent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCourseActivityProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseActivity_id_tenantId_key" ON "CourseActivity"("id", "tenantId");
CREATE INDEX "CourseActivity_tenantId_courseId_isPublished_deletedAt_idx" ON "CourseActivity"("tenantId", "courseId", "isPublished", "deletedAt");
CREATE INDEX "CourseActivity_tenantId_unitId_order_idx" ON "CourseActivity"("tenantId", "unitId", "order");
CREATE INDEX "CourseActivity_tenantId_type_targetId_idx" ON "CourseActivity"("tenantId", "type", "targetId");

CREATE UNIQUE INDEX "UserCourseActivityProgress_id_tenantId_key" ON "UserCourseActivityProgress"("id", "tenantId");
CREATE UNIQUE INDEX "UserCourseActivityProgress_tenantId_userId_activityId_key" ON "UserCourseActivityProgress"("tenantId", "userId", "activityId");
CREATE INDEX "UserCourseActivityProgress_tenantId_userId_status_idx" ON "UserCourseActivityProgress"("tenantId", "userId", "status");
CREATE INDEX "UserCourseActivityProgress_tenantId_activityId_idx" ON "UserCourseActivityProgress"("tenantId", "activityId");

ALTER TABLE "CourseActivity" ADD CONSTRAINT "CourseActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseActivity" ADD CONSTRAINT "CourseActivity_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseActivity" ADD CONSTRAINT "CourseActivity_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "CourseUnit"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "UserCourseActivityProgress" ADD CONSTRAINT "UserCourseActivityProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCourseActivityProgress" ADD CONSTRAINT "UserCourseActivityProgress_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCourseActivityProgress" ADD CONSTRAINT "UserCourseActivityProgress_activityId_tenantId_fkey" FOREIGN KEY ("activityId", "tenantId") REFERENCES "CourseActivity"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

WITH lesson_source AS (
  SELECT
    l.*,
    CASE
      WHEN l."type" = 'practice' AND l."practiceExerciseSetId" IS NOT NULL THEN 'PRACTICE'
      WHEN l."type" = 'exam' AND l."examId" IS NOT NULL THEN 'EXAM'
      ELSE 'LESSON'
    END AS activity_type,
    CASE
      WHEN l."type" = 'practice' AND l."practiceExerciseSetId" IS NOT NULL THEN l."practiceExerciseSetId"
      WHEN l."type" = 'exam' AND l."examId" IS NOT NULL THEN l."examId"
      ELSE l."id"
    END AS activity_target_id,
    CASE
      WHEN l."type" = 'practice' AND l."practiceExerciseSetId" IS NOT NULL THEN 'PRACTICE_SUBMITTED'
      WHEN l."type" = 'exam' AND l."examId" IS NOT NULL THEN 'EXAM_SUBMITTED'
      ELSE 'LESSON_COMPLETED'
    END AS activity_completion_policy,
    CASE
      WHEN l."type" = 'practice' AND l."practiceExerciseSetId" IS NOT NULL THEN COALESCE(pes."isPublished", false)
      WHEN l."type" = 'exam' AND l."examId" IS NOT NULL THEN COALESCE(e."isPublished", false)
      ELSE true
    END AS activity_is_published,
    md5('lesson:' || l."tenantId" || ':' || l."id") AS activity_hash
  FROM "Lesson" l
  LEFT JOIN "PracticeExerciseSet" pes
    ON pes."id" = l."practiceExerciseSetId"
   AND pes."tenantId" = l."tenantId"
   AND pes."deletedAt" IS NULL
  LEFT JOIN "Exam" e
    ON e."id" = l."examId"
   AND e."tenantId" = l."tenantId"
   AND e."deletedAt" IS NULL
  WHERE l."deletedAt" IS NULL
)
INSERT INTO "CourseActivity" (
  "id",
  "tenantId",
  "courseId",
  "unitId",
  "type",
  "targetId",
  "order",
  "isRequired",
  "isPublished",
  "estimatedMinutes",
  "completionPolicy",
  "createdAt",
  "updatedAt"
)
SELECT
  lower(
    substr(activity_hash, 1, 8) || '-' ||
    substr(activity_hash, 9, 4) || '-' ||
    substr(activity_hash, 13, 4) || '-' ||
    substr(activity_hash, 17, 4) || '-' ||
    substr(activity_hash, 21, 12)
  ),
  "tenantId",
  "courseId",
  "unitId",
  activity_type::"CourseActivityType",
  activity_target_id,
  "order",
  true,
  activity_is_published,
  "duration",
  activity_completion_policy::"CourseActivityCompletionPolicy",
  "createdAt",
  "updatedAt"
FROM lesson_source;

WITH practice_source AS (
  SELECT
    pes.*,
    row_number() OVER (PARTITION BY pes."tenantId", pes."courseId" ORDER BY pes."createdAt", pes."id") AS activity_order,
    md5('practice:' || pes."tenantId" || ':' || pes."id") AS activity_hash
  FROM "PracticeExerciseSet" pes
  WHERE pes."courseId" IS NOT NULL
    AND pes."deletedAt" IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "CourseActivity" ca
      WHERE ca."tenantId" = pes."tenantId"
        AND ca."type" = 'PRACTICE'
        AND ca."targetId" = pes."id"
        AND ca."deletedAt" IS NULL
    )
)
INSERT INTO "CourseActivity" (
  "id",
  "tenantId",
  "courseId",
  "unitId",
  "type",
  "targetId",
  "order",
  "isRequired",
  "isPublished",
  "estimatedMinutes",
  "completionPolicy",
  "createdAt",
  "updatedAt"
)
SELECT
  lower(
    substr(activity_hash, 1, 8) || '-' ||
    substr(activity_hash, 9, 4) || '-' ||
    substr(activity_hash, 13, 4) || '-' ||
    substr(activity_hash, 17, 4) || '-' ||
    substr(activity_hash, 21, 12)
  ),
  "tenantId",
  "courseId",
  "unitId",
  'PRACTICE'::"CourseActivityType",
  "id",
  100000 + activity_order,
  true,
  "isPublished",
  10,
  'PRACTICE_SUBMITTED'::"CourseActivityCompletionPolicy",
  "createdAt",
  "updatedAt"
FROM practice_source;

WITH exam_source AS (
  SELECT
    e.*,
    row_number() OVER (PARTITION BY e."tenantId", e."courseId" ORDER BY e."createdAt", e."id") AS activity_order,
    md5('exam:' || e."tenantId" || ':' || e."id") AS activity_hash
  FROM "Exam" e
  WHERE e."courseId" IS NOT NULL
    AND e."deletedAt" IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "CourseActivity" ca
      WHERE ca."tenantId" = e."tenantId"
        AND ca."type" = 'EXAM'
        AND ca."targetId" = e."id"
        AND ca."deletedAt" IS NULL
    )
)
INSERT INTO "CourseActivity" (
  "id",
  "tenantId",
  "courseId",
  "unitId",
  "type",
  "targetId",
  "order",
  "isRequired",
  "isPublished",
  "estimatedMinutes",
  "completionPolicy",
  "createdAt",
  "updatedAt"
)
SELECT
  lower(
    substr(activity_hash, 1, 8) || '-' ||
    substr(activity_hash, 9, 4) || '-' ||
    substr(activity_hash, 13, 4) || '-' ||
    substr(activity_hash, 17, 4) || '-' ||
    substr(activity_hash, 21, 12)
  ),
  "tenantId",
  "courseId",
  "unitId",
  'EXAM'::"CourseActivityType",
  "id",
  200000 + activity_order,
  true,
  "isPublished",
  "durationMinutes",
  'EXAM_SUBMITTED'::"CourseActivityCompletionPolicy",
  "createdAt",
  "updatedAt"
FROM exam_source;

WITH roleplay_source AS (
  SELECT
    rs.*,
    row_number() OVER (PARTITION BY rs."tenantId", rs."courseId" ORDER BY rs."createdAt", rs."id") AS activity_order,
    md5('roleplay:' || rs."tenantId" || ':' || rs."id") AS activity_hash
  FROM "RoleplayScenario" rs
  WHERE rs."courseId" IS NOT NULL
    AND rs."deletedAt" IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "CourseActivity" ca
      WHERE ca."tenantId" = rs."tenantId"
        AND ca."type" = 'ROLEPLAY'
        AND ca."targetId" = rs."id"
        AND ca."deletedAt" IS NULL
    )
)
INSERT INTO "CourseActivity" (
  "id",
  "tenantId",
  "courseId",
  "unitId",
  "type",
  "targetId",
  "order",
  "isRequired",
  "isPublished",
  "estimatedMinutes",
  "completionPolicy",
  "createdAt",
  "updatedAt"
)
SELECT
  lower(
    substr(activity_hash, 1, 8) || '-' ||
    substr(activity_hash, 9, 4) || '-' ||
    substr(activity_hash, 13, 4) || '-' ||
    substr(activity_hash, 17, 4) || '-' ||
    substr(activity_hash, 21, 12)
  ),
  "tenantId",
  "courseId",
  "unitId",
  'ROLEPLAY'::"CourseActivityType",
  "id",
  300000 + activity_order,
  true,
  "isPublished",
  10,
  'ROLEPLAY_COMPLETED'::"CourseActivityCompletionPolicy",
  "createdAt",
  "updatedAt"
FROM roleplay_source;

WITH lesson_progress AS (
  SELECT
    ulp.*,
    ca."id" AS activity_id,
    md5('activity-progress:' || ulp."tenantId" || ':' || ulp."userId" || ':' || ca."id") AS progress_hash
  FROM "UserLessonProgress" ulp
  JOIN "CourseActivity" ca
    ON ca."tenantId" = ulp."tenantId"
   AND ca."type" = 'LESSON'
   AND ca."targetId" = ulp."lessonId"
   AND ca."deletedAt" IS NULL
)
INSERT INTO "UserCourseActivityProgress" (
  "id",
  "tenantId",
  "userId",
  "activityId",
  "status",
  "completedAt",
  "lastAccessedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  lower(
    substr(progress_hash, 1, 8) || '-' ||
    substr(progress_hash, 9, 4) || '-' ||
    substr(progress_hash, 13, 4) || '-' ||
    substr(progress_hash, 17, 4) || '-' ||
    substr(progress_hash, 21, 12)
  ),
  "tenantId",
  "userId",
  activity_id,
  CASE
    WHEN "status" = 'COMPLETED' THEN 'COMPLETED'
    ELSE 'IN_PROGRESS'
  END::"CourseActivityProgressStatus",
  CASE
    WHEN "status" = 'COMPLETED' THEN "updatedAt"
    ELSE NULL
  END,
  "updatedAt",
  "createdAt",
  "updatedAt"
FROM lesson_progress
ON CONFLICT ("tenantId", "userId", "activityId") DO NOTHING;
