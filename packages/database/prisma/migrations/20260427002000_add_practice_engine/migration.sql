-- Add Practice Engine MVP: question bank, exercise sets, submitted attempts, and answer snapshots.

CREATE TYPE "PracticeQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'FILL_BLANK');
CREATE TYPE "PracticeAttemptStatus" AS ENUM ('SUBMITTED');

CREATE TABLE "PracticeQuestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "type" "PracticeQuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "prompt" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB NOT NULL,
    "explanation" TEXT,
    "skillTags" TEXT[],
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeExerciseSet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeExerciseSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeExerciseSetQuestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "exerciseSetId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeExerciseSetQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "exerciseSetId" TEXT NOT NULL,
    "status" "PracticeAttemptStatus" NOT NULL DEFAULT 'SUBMITTED',
    "score" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeAnswer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeAnswer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PracticeQuestion_id_tenantId_key" ON "PracticeQuestion"("id", "tenantId");
CREATE INDEX "PracticeQuestion_tenantId_courseId_deletedAt_idx" ON "PracticeQuestion"("tenantId", "courseId", "deletedAt");
CREATE INDEX "PracticeQuestion_unitId_idx" ON "PracticeQuestion"("unitId");
CREATE INDEX "PracticeQuestion_type_idx" ON "PracticeQuestion"("type");

CREATE UNIQUE INDEX "PracticeExerciseSet_id_tenantId_key" ON "PracticeExerciseSet"("id", "tenantId");
CREATE INDEX "PracticeExerciseSet_tenantId_courseId_isPublished_deletedAt_idx" ON "PracticeExerciseSet"("tenantId", "courseId", "isPublished", "deletedAt");
CREATE INDEX "PracticeExerciseSet_unitId_idx" ON "PracticeExerciseSet"("unitId");

CREATE UNIQUE INDEX "PracticeExerciseSetQuestion_exerciseSetId_questionId_key" ON "PracticeExerciseSetQuestion"("exerciseSetId", "questionId");
CREATE INDEX "PracticeExerciseSetQuestion_tenantId_exerciseSetId_order_idx" ON "PracticeExerciseSetQuestion"("tenantId", "exerciseSetId", "order");
CREATE INDEX "PracticeExerciseSetQuestion_questionId_idx" ON "PracticeExerciseSetQuestion"("questionId");

CREATE UNIQUE INDEX "PracticeAttempt_id_tenantId_key" ON "PracticeAttempt"("id", "tenantId");
CREATE INDEX "PracticeAttempt_tenantId_userId_submittedAt_idx" ON "PracticeAttempt"("tenantId", "userId", "submittedAt");
CREATE INDEX "PracticeAttempt_exerciseSetId_submittedAt_idx" ON "PracticeAttempt"("exerciseSetId", "submittedAt");
CREATE INDEX "PracticeAttempt_courseId_submittedAt_idx" ON "PracticeAttempt"("courseId", "submittedAt");

CREATE UNIQUE INDEX "PracticeAnswer_attemptId_questionId_key" ON "PracticeAnswer"("attemptId", "questionId");
CREATE INDEX "PracticeAnswer_tenantId_attemptId_idx" ON "PracticeAnswer"("tenantId", "attemptId");
CREATE INDEX "PracticeAnswer_questionId_idx" ON "PracticeAnswer"("questionId");

ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "CourseUnit"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "PracticeExerciseSet" ADD CONSTRAINT "PracticeExerciseSet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeExerciseSet" ADD CONSTRAINT "PracticeExerciseSet_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeExerciseSet" ADD CONSTRAINT "PracticeExerciseSet_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "CourseUnit"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "PracticeExerciseSetQuestion" ADD CONSTRAINT "PracticeExerciseSetQuestion_exerciseSetId_tenantId_fkey" FOREIGN KEY ("exerciseSetId", "tenantId") REFERENCES "PracticeExerciseSet"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeExerciseSetQuestion" ADD CONSTRAINT "PracticeExerciseSetQuestion_questionId_tenantId_fkey" FOREIGN KEY ("questionId", "tenantId") REFERENCES "PracticeQuestion"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_exerciseSetId_tenantId_fkey" FOREIGN KEY ("exerciseSetId", "tenantId") REFERENCES "PracticeExerciseSet"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_attemptId_tenantId_fkey" FOREIGN KEY ("attemptId", "tenantId") REFERENCES "PracticeAttempt"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_questionId_tenantId_fkey" FOREIGN KEY ("questionId", "tenantId") REFERENCES "PracticeQuestion"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
