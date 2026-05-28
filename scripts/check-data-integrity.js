#!/usr/bin/env node
/* eslint-disable no-undef, turbo/no-undeclared-env-vars */

const { PrismaClient } = require('@repo/database');

const SAMPLE_LIMIT = Number.parseInt(process.env.DATA_INTEGRITY_SAMPLE_LIMIT || '5', 10);

const prisma = new PrismaClient({
  log:
    process.env.DATA_INTEGRITY_QUERY_LOG === '1' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

const checks = [
  {
    name: 'course enrollments reference same-tenant users and courses',
    countSql: `
      SELECT COUNT(*)::int AS count
      FROM "CourseEnrollment" enrollment
      LEFT JOIN "User" learner
        ON learner.id = enrollment."userId"
       AND learner."tenantId" = enrollment."tenantId"
      LEFT JOIN "Course" course
        ON course.id = enrollment."courseId"
       AND course."tenantId" = enrollment."tenantId"
      WHERE learner.id IS NULL OR course.id IS NULL
    `,
    sampleSql: `
      SELECT enrollment.id
      FROM "CourseEnrollment" enrollment
      LEFT JOIN "User" learner
        ON learner.id = enrollment."userId"
       AND learner."tenantId" = enrollment."tenantId"
      LEFT JOIN "Course" course
        ON course.id = enrollment."courseId"
       AND course."tenantId" = enrollment."tenantId"
      WHERE learner.id IS NULL OR course.id IS NULL
      ORDER BY enrollment.id
      LIMIT $1
    `,
  },
  {
    name: 'lesson progress references same-tenant users and lessons',
    countSql: `
      SELECT COUNT(*)::int AS count
      FROM "UserLessonProgress" progress
      LEFT JOIN "User" learner
        ON learner.id = progress."userId"
       AND learner."tenantId" = progress."tenantId"
      LEFT JOIN "Lesson" lesson
        ON lesson.id = progress."lessonId"
       AND lesson."tenantId" = progress."tenantId"
      WHERE learner.id IS NULL OR lesson.id IS NULL
    `,
    sampleSql: `
      SELECT progress.id
      FROM "UserLessonProgress" progress
      LEFT JOIN "User" learner
        ON learner.id = progress."userId"
       AND learner."tenantId" = progress."tenantId"
      LEFT JOIN "Lesson" lesson
        ON lesson.id = progress."lessonId"
       AND lesson."tenantId" = progress."tenantId"
      WHERE learner.id IS NULL OR lesson.id IS NULL
      ORDER BY progress.id
      LIMIT $1
    `,
  },
  {
    name: 'lesson progress belongs to a course enrollment',
    countSql: `
      SELECT COUNT(*)::int AS count
      FROM "UserLessonProgress" progress
      JOIN "Lesson" lesson
        ON lesson.id = progress."lessonId"
       AND lesson."tenantId" = progress."tenantId"
      LEFT JOIN "CourseEnrollment" enrollment
        ON enrollment."userId" = progress."userId"
       AND enrollment."courseId" = lesson."courseId"
       AND enrollment."tenantId" = progress."tenantId"
      WHERE enrollment.id IS NULL
    `,
    sampleSql: `
      SELECT progress.id
      FROM "UserLessonProgress" progress
      JOIN "Lesson" lesson
        ON lesson.id = progress."lessonId"
       AND lesson."tenantId" = progress."tenantId"
      LEFT JOIN "CourseEnrollment" enrollment
        ON enrollment."userId" = progress."userId"
       AND enrollment."courseId" = lesson."courseId"
       AND enrollment."tenantId" = progress."tenantId"
      WHERE enrollment.id IS NULL
      ORDER BY progress.id
      LIMIT $1
    `,
  },
  {
    name: 'learning activity course and lesson agree',
    countSql: `
      SELECT COUNT(*)::int AS count
      FROM "LearningActivity" activity
      LEFT JOIN "Lesson" lesson
        ON lesson.id = activity."lessonId"
       AND lesson."tenantId" = activity."tenantId"
      WHERE lesson.id IS NULL OR lesson."courseId" <> activity."courseId"
    `,
    sampleSql: `
      SELECT activity.id
      FROM "LearningActivity" activity
      LEFT JOIN "Lesson" lesson
        ON lesson.id = activity."lessonId"
       AND lesson."tenantId" = activity."tenantId"
      WHERE lesson.id IS NULL OR lesson."courseId" <> activity."courseId"
      ORDER BY activity.id
      LIMIT $1
    `,
  },
  {
    name: 'practice attempts reference same-tenant users and exercise sets',
    countSql: `
      SELECT COUNT(*)::int AS count
      FROM "PracticeAttempt" attempt
      LEFT JOIN "User" learner
        ON learner.id = attempt."userId"
       AND learner."tenantId" = attempt."tenantId"
      LEFT JOIN "PracticeExerciseSet" exercise_set
        ON exercise_set.id = attempt."exerciseSetId"
       AND exercise_set."tenantId" = attempt."tenantId"
      WHERE learner.id IS NULL OR exercise_set.id IS NULL
    `,
    sampleSql: `
      SELECT attempt.id
      FROM "PracticeAttempt" attempt
      LEFT JOIN "User" learner
        ON learner.id = attempt."userId"
       AND learner."tenantId" = attempt."tenantId"
      LEFT JOIN "PracticeExerciseSet" exercise_set
        ON exercise_set.id = attempt."exerciseSetId"
       AND exercise_set."tenantId" = attempt."tenantId"
      WHERE learner.id IS NULL OR exercise_set.id IS NULL
      ORDER BY attempt.id
      LIMIT $1
    `,
  },
  {
    name: 'practice answers reference same-tenant attempts and questions',
    countSql: `
      SELECT COUNT(*)::int AS count
      FROM "PracticeAnswer" answer
      LEFT JOIN "PracticeAttempt" attempt
        ON attempt.id = answer."attemptId"
       AND attempt."tenantId" = answer."tenantId"
      LEFT JOIN "PracticeQuestion" question
        ON question.id = answer."questionId"
       AND question."tenantId" = answer."tenantId"
      WHERE attempt.id IS NULL OR question.id IS NULL
    `,
    sampleSql: `
      SELECT answer.id
      FROM "PracticeAnswer" answer
      LEFT JOIN "PracticeAttempt" attempt
        ON attempt.id = answer."attemptId"
       AND attempt."tenantId" = answer."tenantId"
      LEFT JOIN "PracticeQuestion" question
        ON question.id = answer."questionId"
       AND question."tenantId" = answer."tenantId"
      WHERE attempt.id IS NULL OR question.id IS NULL
      ORDER BY answer.id
      LIMIT $1
    `,
  },
  {
    name: 'exam attempts reference same-tenant users and exams',
    countSql: `
      SELECT COUNT(*)::int AS count
      FROM "ExamAttempt" attempt
      LEFT JOIN "User" learner
        ON learner.id = attempt."userId"
       AND learner."tenantId" = attempt."tenantId"
      LEFT JOIN "Exam" exam
        ON exam.id = attempt."examId"
       AND exam."tenantId" = attempt."tenantId"
      WHERE learner.id IS NULL OR exam.id IS NULL
    `,
    sampleSql: `
      SELECT attempt.id
      FROM "ExamAttempt" attempt
      LEFT JOIN "User" learner
        ON learner.id = attempt."userId"
       AND learner."tenantId" = attempt."tenantId"
      LEFT JOIN "Exam" exam
        ON exam.id = attempt."examId"
       AND exam."tenantId" = attempt."tenantId"
      WHERE learner.id IS NULL OR exam.id IS NULL
      ORDER BY attempt.id
      LIMIT $1
    `,
  },
  {
    name: 'exam answers reference same-tenant attempts and questions',
    countSql: `
      SELECT COUNT(*)::int AS count
      FROM "ExamAnswer" answer
      LEFT JOIN "ExamAttempt" attempt
        ON attempt.id = answer."attemptId"
       AND attempt."tenantId" = answer."tenantId"
      LEFT JOIN "ExamQuestion" question
        ON question.id = answer."questionId"
       AND question."tenantId" = answer."tenantId"
      WHERE attempt.id IS NULL OR question.id IS NULL
    `,
    sampleSql: `
      SELECT answer.id
      FROM "ExamAnswer" answer
      LEFT JOIN "ExamAttempt" attempt
        ON attempt.id = answer."attemptId"
       AND attempt."tenantId" = answer."tenantId"
      LEFT JOIN "ExamQuestion" question
        ON question.id = answer."questionId"
       AND question."tenantId" = answer."tenantId"
      WHERE attempt.id IS NULL OR question.id IS NULL
      ORDER BY answer.id
      LIMIT $1
    `,
  },
];

async function runCheck(check) {
  const rows = await prisma.$queryRawUnsafe(check.countSql);
  const count = Number(rows[0]?.count ?? 0);
  if (count === 0) {
    return { name: check.name, count, sampleIds: [] };
  }

  const sampleRows = await prisma.$queryRawUnsafe(check.sampleSql, SAMPLE_LIMIT);
  return {
    name: check.name,
    count,
    sampleIds: sampleRows.map((row) => row.id),
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required for data integrity checks.');
    process.exit(1);
  }

  const results = [];
  for (const check of checks) {
    results.push(await runCheck(check));
  }

  const failures = results.filter((result) => result.count > 0);
  if (failures.length === 0) {
    console.log(`data integrity checks passed (${checks.length} checks)`);
    return;
  }

  console.error(`data integrity checks failed (${failures.length}/${checks.length} checks)`);
  for (const failure of failures) {
    console.error(
      `${failure.name}: ${failure.count} row(s); sample ids: ${failure.sampleIds.join(', ')}`,
    );
  }
  process.exit(1);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
