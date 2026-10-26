import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Role } from '@repo/database';
import { AiGovernanceService } from './ai/ai-governance.service';
import { AuditLogService, AuditStatus } from './common/services/audit-log.service';
import { PrismaService } from './common/services/prisma.service';
import { LearningAccessService } from './common/services/learning-access.service';
import { AdaptiveLearningService } from './adaptive-learning/adaptive-learning.service';
import { PracticeService } from './practice/practice.service';
import { SrsService } from './srs/srs.service';
import { DiscussionService } from './discussion/discussion.service';
import { CourseService } from './course/course.service';

// Opt in against an isolated, migrated test database only.
const databaseUrl = process.env.LMS_INTEGRATION_DATABASE_URL;
describe.skipIf(!databaseUrl)('Learning security and workflow (PostgreSQL)', () => {
  let db: PrismaService;
  let access: LearningAccessService;
  const tenantIds: string[] = [];

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/lms_test') {
      throw new Error('Use an isolated local database named lms_test');
    }
    vi.stubEnv('DATABASE_URL', databaseUrl);
    db = new PrismaService();
    await db.$connect();
    access = new LearningAccessService(db);
  });

  afterAll(async () => {
    if (!db) return;
    try {
      await db.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    } finally {
      await db.onModuleDestroy();
      vi.unstubAllEnvs();
    }
  });

  async function fixture() {
    const tenant = await db.tenant.create({
      data: { name: 'LMS regression', slug: randomUUID(), settings: {} },
    });
    tenantIds.push(tenant.id);
    const users = await Promise.all(
      ['student', 'other', 'instructor'].map((name) =>
        db.user.create({
          data: {
            tenantId: tenant.id,
            email: `${name}@test.local`,
            password: 'test-only',
            fullName: name,
            role: name === 'instructor' ? Role.INSTRUCTOR : Role.STUDENT,
          },
        }),
      ),
    );
    const [student, other, instructor] = users;
    const course = await db.course.create({ data: { tenantId: tenant.id, title: 'Course' } });
    await db.courseEnrollment.createMany({
      data: [student, other].map((user) => ({
        tenantId: tenant.id,
        courseId: course.id,
        userId: user.id,
      })),
    });
    const questions = await Promise.all(
      [0, 1].map((index) =>
        db.practiceQuestion.create({
          data: {
            tenantId: tenant.id,
            courseId: course.id,
            type: 'FILL_BLANK',
            prompt: `Question ${index}`,
            correctAnswer: 'ok',
            skillTags: ['GRAMMAR'],
          },
        }),
      ),
    );
    const path = await db.adaptiveLearningPathItem.create({
      data: {
        tenantId: tenant.id,
        courseId: course.id,
        userId: student.id,
        sourceSkillCode: 'GRAMMAR',
        questionIds: questions.map((question) => question.id),
        priority: 22,
        reason: {},
      },
    });
    const sourceSet = await db.practiceExerciseSet.create({
      data: {
        tenantId: tenant.id,
        courseId: course.id,
        title: 'Source practice',
        isPublished: true,
        questions: {
          create: questions.map((question, order) => ({ questionId: question.id, order })),
        },
      },
    });
    return { tenant, student, other, instructor, course, questions, path, sourceSet };
  }

  function governance() {
    const gateway = {
      getRuntimeConfig: () => ({ provider: 'groq', enabled: true, model: 'test' }),
    };
    return new AiGovernanceService(db, gateway as never, new AuditLogService(db));
  }

  it('allows exactly one concurrent reservation when one daily request remains', async () => {
    const { tenant, student } = await fixture();
    await db.aiUsageQuota.create({
      data: {
        tenantId: tenant.id,
        userId: student.id,
        requestsUsed: 49,
        requestLimit: 50,
        resetAt: new Date(Date.now() + 86_400_000),
      },
    });
    const service = governance();
    const input = {
      tenantId: tenant.id,
      userId: student.id,
      role: student.role,
      feature: 'tutor.explain' as const,
      promptVersion: 'test',
    };
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => service.reserve(input)),
    );
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(
      (
        await db.aiUsageQuota.findUniqueOrThrow({
          where: { tenantId_userId: { tenantId: tenant.id, userId: student.id } },
        })
      ).requestsUsed,
    ).toBe(50);
    expect(await db.usageLedger.count({ where: { tenantId: tenant.id } })).toBe(1);
    const success = results.find((result) => result.status === 'fulfilled');
    if (success?.status === 'fulfilled') {
      await service.recordResult(success.value, AuditStatus.SUCCESS);
      await service.recordResult(success.value, AuditStatus.SUCCESS);
      expect(await db.usageLedger.count({ where: { tenantId: tenant.id } })).toBe(1);
    }
  });

  it('counts pending reservations against the tenant limit across different users', async () => {
    const { tenant, student, other } = await fixture();
    const plan = await db.billingPlan.create({
      data: { tenantId: tenant.id, name: 'Test', code: 'test' },
    });
    await db.tenantSubscription.create({
      data: { tenantId: tenant.id, planId: plan.id, aiRequestQuota: 1 },
    });
    const service = governance();
    const results = await Promise.allSettled(
      [student, other].map((user) =>
        service.reserve({
          tenantId: tenant.id,
          userId: user.id,
          role: user.role,
          feature: 'tutor.explain',
          promptVersion: 'test',
        }),
      ),
    );
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await db.usageLedger.count({ where: { tenantId: tenant.id } })).toBe(1);
    expect(await db.aiUsageQuota.count({ where: { tenantId: tenant.id } })).toBe(1);
  });

  it('starts the selected questions once, enforces ownership, and completes the path on submission', async () => {
    const { tenant, student, other, path, questions, course } = await fixture();
    const adaptive = new AdaptiveLearningService(db, access);
    const srs = new SrsService(db, access);
    const practice = new PracticeService(
      db,
      access,
      { applyAnswerEvents: vi.fn() } as never,
      srs,
      {} as never,
      {} as never,
    );
    const starts = await Promise.all([
      adaptive.startPractice(tenant.id, student, path.id),
      adaptive.startPractice(tenant.id, student, path.id),
    ]);
    expect(starts[0]).toEqual(starts[1]);
    const setId = starts[0].exerciseSetId;
    const set = await practice.getExerciseSet(setId, tenant.id, student);
    expect(set.questions.map((link) => link.question.id)).toEqual(
      questions.map((question) => question.id),
    );
    expect(set.questions[0].question).not.toHaveProperty('correctAnswer');
    await expect(practice.getExerciseSet(setId, tenant.id, other)).rejects.toThrow();
    await expect(practice.submitAttempt(setId, tenant.id, other, [])).rejects.toThrow();
    const discussions = new DiscussionService(db, access);
    await expect(
      discussions.listThreads(tenant.id, other, {
        targetType: 'PRACTICE_EXERCISE_SET',
        exerciseSetId: setId,
      }),
    ).rejects.toThrow();
    await expect(adaptive.startPractice(tenant.id, other, path.id)).rejects.toThrow();
    expect(
      (await practice.listExerciseSets(tenant.id, student, {})).data.some(
        (entry) => entry.id === setId,
      ),
    ).toBe(false);
    const timeline = await new CourseService(db, access, new AuditLogService(db)).getActivities(
      course.id,
      tenant.id,
      other,
    );
    expect(JSON.stringify(timeline)).not.toContain(setId);
    await practice.submitAttempt(
      setId,
      tenant.id,
      student,
      questions.map((question) => ({ questionId: question.id, answer: 'ok' })),
    );
    expect(
      (
        await db.adaptiveLearningPathItem.findFirstOrThrow({
          where: { id: path.id, tenantId: tenant.id },
        })
      ).status,
    ).toBe('COMPLETED');
    expect(
      (await adaptive.getNextSteps(tenant.id, student, {})).steps.some(
        (step) => step.pathItemId === path.id,
      ),
    ).toBe(false);
  });

  it('combines custom card filters and hides unpublished source questions', async () => {
    const { tenant, student, questions, sourceSet } = await fixture();
    const srs = new SrsService(db, access);
    await srs.createCustomCard(tenant.id, student.id, {
      customContent: { front: 'One', deck: 'Deck', category: 'A' },
    });
    await srs.createCustomCard(tenant.id, student.id, {
      customContent: { front: 'Two', deck: 'Deck', category: 'B' },
    });
    expect(
      (await srs.getQueue(tenant.id, student.id, { deck: 'Deck', category: 'B' })).map(
        (card) => card.question?.prompt,
      ),
    ).toEqual(['Two']);
    await db.reviewCard.create({
      data: {
        tenantId: tenant.id,
        userId: student.id,
        sourceType: 'PRACTICE_QUESTION',
        sourceId: questions[0].id,
        dueAt: new Date(0),
      },
    });
    expect((await srs.getDueSummary(tenant.id, student.id)).total).toBe(3);
    await db.practiceExerciseSet.update({
      where: { id_tenantId: { id: sourceSet.id, tenantId: tenant.id } },
      data: { isPublished: false },
    });
    expect((await srs.getDueSummary(tenant.id, student.id)).total).toBe(2);
    expect(
      (await srs.getQueue(tenant.id, student.id)).every((card) => card.sourceType === 'CUSTOM'),
    ).toBe(true);
  });

  it('hides revoked course sources and private cards from instructors before pagination and counts', async () => {
    const { tenant, student, instructor, course, questions, path } = await fixture();
    const srs = new SrsService(db, access);
    const adaptive = new AdaptiveLearningService(db, access);
    await db.courseInstructorAssignment.create({
      data: { tenantId: tenant.id, courseId: course.id, instructorId: instructor.id },
    });
    const card = await db.reviewCard.create({
      data: {
        tenantId: tenant.id,
        userId: student.id,
        sourceType: 'PRACTICE_QUESTION',
        sourceId: questions[0].id,
        skillCodes: ['GRAMMAR'],
        dueAt: new Date(0),
      },
    });
    await srs.createCustomCard(tenant.id, student.id, {
      customContent: { front: 'Private', back: 'Secret' },
      skillCodes: ['PRIVATE'],
    });
    const instructorView = await adaptive.getNextSteps(tenant.id, instructor, {
      userId: student.id,
    });
    expect(instructorView.signals.dueNow).toBe(1);
    expect(instructorView.steps.flatMap((step) => step.signals.topDueSkills)).not.toContain(
      'PRIVATE',
    );
    expect(instructorView.signals.trackedSkillCount).toBe(0);
    await db.courseEnrollment.updateMany({
      where: { tenantId: tenant.id, courseId: course.id, userId: student.id },
      data: { status: 'REVOKED' },
    });
    const queue = await srs.getQueue(tenant.id, student.id, { limit: 1 });
    expect(queue).toHaveLength(1);
    expect(queue[0].sourceType).toBe('CUSTOM');
    expect((await srs.getDueSummary(tenant.id, student.id)).dueNow).toBe(1);
    await expect(srs.submitReview(tenant.id, student.id, card.id, 'GOOD')).rejects.toThrow();
    expect(
      (await adaptive.getNextSteps(tenant.id, student, {})).steps.some(
        (step) => step.pathItemId === path.id,
      ),
    ).toBe(false);
    await expect(adaptive.startPractice(tenant.id, student, path.id)).rejects.toThrow();
  });
});
