-- Add Exam/Test Engine MVP: templates, sections, questions, attempt lifecycle, and answer snapshots.

CREATE TYPE "ExamQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'FILL_BLANK');
CREATE TYPE "ExamAttemptStatus" AS ENUM ('STARTED', 'SUBMITTED');

CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "passingScore" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamSection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamQuestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "type" "ExamQuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "prompt" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "skillTags" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "status" "ExamAttemptStatus" NOT NULL DEFAULT 'STARTED',
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAnswer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Exam_id_tenantId_key" ON "Exam"("id", "tenantId");
CREATE INDEX "Exam_tenantId_courseId_isPublished_deletedAt_idx" ON "Exam"("tenantId", "courseId", "isPublished", "deletedAt");
CREATE INDEX "Exam_unitId_idx" ON "Exam"("unitId");

CREATE UNIQUE INDEX "ExamSection_id_tenantId_key" ON "ExamSection"("id", "tenantId");
CREATE INDEX "ExamSection_tenantId_examId_order_idx" ON "ExamSection"("tenantId", "examId", "order");

CREATE UNIQUE INDEX "ExamQuestion_id_tenantId_key" ON "ExamQuestion"("id", "tenantId");
CREATE INDEX "ExamQuestion_tenantId_sectionId_order_idx" ON "ExamQuestion"("tenantId", "sectionId", "order");
CREATE INDEX "ExamQuestion_type_idx" ON "ExamQuestion"("type");

CREATE UNIQUE INDEX "ExamAttempt_id_tenantId_key" ON "ExamAttempt"("id", "tenantId");
CREATE INDEX "ExamAttempt_tenantId_userId_startedAt_idx" ON "ExamAttempt"("tenantId", "userId", "startedAt");
CREATE INDEX "ExamAttempt_examId_startedAt_idx" ON "ExamAttempt"("examId", "startedAt");
CREATE INDEX "ExamAttempt_courseId_startedAt_idx" ON "ExamAttempt"("courseId", "startedAt");

CREATE UNIQUE INDEX "ExamAnswer_attemptId_questionId_key" ON "ExamAnswer"("attemptId", "questionId");
CREATE INDEX "ExamAnswer_tenantId_attemptId_idx" ON "ExamAnswer"("tenantId", "attemptId");
CREATE INDEX "ExamAnswer_questionId_idx" ON "ExamAnswer"("questionId");

ALTER TABLE "Exam" ADD CONSTRAINT "Exam_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "CourseUnit"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "ExamSection" ADD CONSTRAINT "ExamSection_examId_tenantId_fkey" FOREIGN KEY ("examId", "tenantId") REFERENCES "Exam"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_sectionId_tenantId_fkey" FOREIGN KEY ("sectionId", "tenantId") REFERENCES "ExamSection"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_courseId_tenantId_fkey" FOREIGN KEY ("courseId", "tenantId") REFERENCES "Course"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_tenantId_fkey" FOREIGN KEY ("examId", "tenantId") REFERENCES "Exam"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_attemptId_tenantId_fkey" FOREIGN KEY ("attemptId", "tenantId") REFERENCES "ExamAttempt"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_questionId_tenantId_fkey" FOREIGN KEY ("questionId", "tenantId") REFERENCES "ExamQuestion"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
