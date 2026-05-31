-- AlterEnum
ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'practice';
ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'exam';

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "practiceExerciseSetId" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "examId" TEXT;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_practiceExerciseSetId_tenantId_fkey" FOREIGN KEY ("practiceExerciseSetId", "tenantId") REFERENCES "PracticeExerciseSet"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_examId_tenantId_fkey" FOREIGN KEY ("examId", "tenantId") REFERENCES "Exam"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;
