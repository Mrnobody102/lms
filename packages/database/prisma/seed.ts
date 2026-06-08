import {
  Prisma,
  Role,
  LessonType,
  EnrollmentStatus,
  CourseInstructorRole,
  CourseRunStatus,
  AttendanceStatus,
  BillingPlanStatus,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus,
  PracticeQuestionType,
  ExamQuestionType,
} from '../src/generated/prisma/client/client.js';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { createPrismaClient } from '../src/client-factory.js';
import { BDHVS_COURSES, LEGACY_DEMO_COURSE_SLUGS } from './seed-data/bdhvs-courses.js';
import type { DemoCourseSeed, SampleQuestionSeed } from './seed-data/bdhvs-courses.js';

const prisma = createPrismaClient();

function deterministicUuid(input: string) {
  const hash = createHash('sha256').update(input).digest('hex');
  const variant = ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${variant}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join('-');
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function upsertPracticeQuestion(
  tenantId: string,
  courseId: string,
  unitId: string,
  seed: SampleQuestionSeed,
) {
  const id = deterministicUuid(`demo:${courseId}:practice-question:${seed.key}`);
  const options = seed.options === undefined ? undefined : toInputJson(seed.options);
  const correctAnswer = toInputJson(seed.correctAnswer);
  return prisma.practiceQuestion.upsert({
    where: { id },
    update: {
      type: seed.type as PracticeQuestionType,
      prompt: seed.prompt,
      options,
      correctAnswer,
      explanation: seed.explanation ?? null,
      skillTags: seed.skillTags,
      deletedAt: null,
    },
    create: {
      id,
      tenantId,
      courseId,
      unitId,
      type: seed.type as PracticeQuestionType,
      prompt: seed.prompt,
      options,
      correctAnswer,
      explanation: seed.explanation ?? null,
      skillTags: seed.skillTags,
    },
  });
}

async function upsertExamQuestion(
  tenantId: string,
  courseId: string,
  sectionId: string,
  seed: SampleQuestionSeed,
  order: number,
) {
  const id = deterministicUuid(`demo:${courseId}:exam-question:${seed.key}`);
  const options = seed.options === undefined ? undefined : toInputJson(seed.options);
  const correctAnswer = toInputJson(seed.correctAnswer);
  return prisma.examQuestion.upsert({
    where: { id },
    update: {
      type: seed.type as ExamQuestionType,
      prompt: seed.prompt,
      options,
      correctAnswer,
      explanation: seed.explanation ?? null,
      points: seed.points ?? 1,
      skillTags: seed.skillTags,
      order,
    },
    create: {
      id,
      tenantId,
      sectionId,
      type: seed.type as ExamQuestionType,
      prompt: seed.prompt,
      options,
      correctAnswer,
      explanation: seed.explanation ?? null,
      points: seed.points ?? 1,
      skillTags: seed.skillTags,
      order,
    },
  });
}

async function replacePracticeSetQuestions(
  tenantId: string,
  exerciseSetId: string,
  questionIds: string[],
) {
  await prisma.practiceExerciseSetQuestion.deleteMany({
    where: { exerciseSetId },
  });
  await linkPracticeSetQuestions(tenantId, exerciseSetId, questionIds);
}

async function linkPracticeSetQuestions(
  tenantId: string,
  exerciseSetId: string,
  questionIds: string[],
) {
  for (let order = 0; order < questionIds.length; order += 1) {
    const questionId = questionIds[order];
    await prisma.practiceExerciseSetQuestion.upsert({
      where: {
        exerciseSetId_questionId: { exerciseSetId, questionId },
      },
      update: { order },
      create: { tenantId, exerciseSetId, questionId, order },
    });
  }
}

async function deleteLegacyDemoCourses(tenantId: string) {
  await prisma.course.deleteMany({
    where: {
      tenantId,
      slug: { in: LEGACY_DEMO_COURSE_SLUGS },
    },
  });
}

async function upsertDemoUser(
  tenantId: string,
  email: string,
  fullName: string,
  role: Role,
  hashedPassword: string,
) {
  const identity = await prisma.globalUserIdentity.upsert({
    where: { normalizedEmail: email },
    update: { displayName: fullName },
    create: { normalizedEmail: email, displayName: fullName },
  });

  return prisma.user.upsert({
    where: { tenantId_email: { tenantId, email } },
    update: {
      fullName,
      role,
      password: hashedPassword,
      globalIdentityId: identity.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      tenantId,
      email,
      password: hashedPassword,
      fullName,
      role,
      globalIdentityId: identity.id,
    },
  });
}

async function seedLanguageCourse(input: {
  tenantId: string;
  studentId: string;
  hashedPassword: string;
  programId: string;
  seed: DemoCourseSeed;
  index: number;
}) {
  const { tenantId, studentId, hashedPassword, programId, seed, index } = input;
  const skillTags = seed.skillTags ?? ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING', 'WRITING'];
  const courseSubject = seed.courseSubject ?? 'language';
  const instructor = await upsertDemoUser(
    tenantId,
    seed.instructorEmail,
    seed.instructorName,
    Role.INSTRUCTOR,
    hashedPassword,
  );

  await prisma.instructorSpecialty.upsert({
    where: {
      tenantId_instructorId_subject_languageCode_levelRange: {
        tenantId,
        instructorId: instructor.id,
        subject: seed.instructorSubject,
        languageCode: seed.languageCode,
        levelRange: seed.instructorLevelRange,
      },
    },
    update: {
      skillTags,
      bio: `${seed.instructorName} phụ trách ${seed.title}.`,
      weeklyCapacity: 12,
    },
    create: {
      tenantId,
      instructorId: instructor.id,
      subject: seed.instructorSubject,
      languageCode: seed.languageCode,
      levelRange: seed.instructorLevelRange,
      skillTags,
      certifications: toInputJson([{ name: seed.proficiencyLevel, issuer: 'Demo Academic Team' }]),
      bio: `${seed.instructorName} phụ trách ${seed.title}.`,
      weeklyCapacity: 12,
    },
  });

  const levelId = deterministicUuid(`demo:level:${seed.key}`);
  const level = await prisma.level.upsert({
    where: { id: levelId },
    update: {
      title: seed.proficiencyLevel,
      description: seed.description,
      order: index + 10,
      isActive: true,
      deletedAt: null,
    },
    create: {
      id: levelId,
      tenantId,
      programId,
      title: seed.proficiencyLevel,
      description: seed.description,
      order: index + 10,
    },
  });

  const course = await prisma.course.upsert({
    where: { tenantId_slug: { tenantId, slug: seed.slug } },
    update: {
      title: seed.title,
      description: seed.description,
      coverImageUrl: seed.coverImageUrl,
      languageCode: seed.languageCode,
      proficiencyLevel: seed.proficiencyLevel,
      subject: courseSubject,
      levelId: level.id,
      totalDuration: seed.units.reduce(
        (total, unit) =>
          total + unit.lessons.reduce((sum, lesson) => sum + (lesson.duration ?? 25), 0),
        0,
      ),
      isActive: true,
      deletedAt: null,
    },
    create: {
      tenantId,
      title: seed.title,
      slug: seed.slug,
      description: seed.description,
      coverImageUrl: seed.coverImageUrl,
      languageCode: seed.languageCode,
      proficiencyLevel: seed.proficiencyLevel,
      subject: courseSubject,
      levelId: level.id,
      totalDuration: seed.units.reduce(
        (total, unit) =>
          total + unit.lessons.reduce((sum, lesson) => sum + (lesson.duration ?? 25), 0),
        0,
      ),
      isActive: true,
    },
  });

  await prisma.courseInstructorAssignment.upsert({
    where: {
      tenantId_courseId_instructorId: {
        tenantId,
        courseId: course.id,
        instructorId: instructor.id,
      },
    },
    update: { role: CourseInstructorRole.OWNER },
    create: {
      tenantId,
      courseId: course.id,
      instructorId: instructor.id,
      role: CourseInstructorRole.OWNER,
    },
  });

  const unitIds: string[] = [];
  for (let unitIndex = 0; unitIndex < seed.units.length; unitIndex += 1) {
    const unitSeed = seed.units[unitIndex];
    const unitId = deterministicUuid(`demo:${seed.key}:unit:${unitSeed.key}`);
    const unit = await prisma.courseUnit.upsert({
      where: { id: unitId },
      update: {
        title: unitSeed.title,
        description: unitSeed.description,
        order: unitIndex,
        deletedAt: null,
      },
      create: {
        id: unitId,
        tenantId,
        courseId: course.id,
        title: unitSeed.title,
        description: unitSeed.description,
        order: unitIndex,
      },
    });
    unitIds.push(unit.id);

    for (let lessonIndex = 0; lessonIndex < unitSeed.lessons.length; lessonIndex += 1) {
      const lessonSeed = unitSeed.lessons[lessonIndex];
      await prisma.lesson.upsert({
        where: { id: deterministicUuid(`demo:${seed.key}:lesson:${lessonSeed.key}`) },
        update: {
          title: lessonSeed.title,
          type: lessonSeed.type ?? LessonType.text,
          content: lessonSeed.content,
          duration: lessonSeed.duration ?? 25,
          order: lessonIndex,
          unitId: unit.id,
          deletedAt: null,
        },
        create: {
          id: deterministicUuid(`demo:${seed.key}:lesson:${lessonSeed.key}`),
          tenantId,
          courseId: course.id,
          unitId: unit.id,
          title: lessonSeed.title,
          type: lessonSeed.type ?? LessonType.text,
          content: lessonSeed.content,
          duration: lessonSeed.duration ?? 25,
          order: lessonIndex,
        },
      });
    }
  }

  const questionIds = [];
  for (const questionSeed of seed.practiceQuestions) {
    const question = await upsertPracticeQuestion(tenantId, course.id, unitIds[0], questionSeed);
    questionIds.push(question.id);
  }

  const practiceSetId = deterministicUuid(`demo:${seed.key}:practice-set:core`);
  const practiceSet = await prisma.practiceExerciseSet.upsert({
    where: { id: practiceSetId },
    update: {
      title: `${seed.proficiencyLevel} - Luyện tập trọng tâm`,
      description: `Bài luyện tập mô phỏng kỹ năng trọng tâm của ${seed.proficiencyLevel}.`,
      isPublished: true,
      deletedAt: null,
    },
    create: {
      id: practiceSetId,
      tenantId,
      courseId: course.id,
      unitId: unitIds[0],
      title: `${seed.proficiencyLevel} - Luyện tập trọng tâm`,
      description: `Bài luyện tập mô phỏng kỹ năng trọng tâm của ${seed.proficiencyLevel}.`,
      isPublished: true,
    },
  });
  await replacePracticeSetQuestions(tenantId, practiceSet.id, questionIds);

  const practiceLessonId = deterministicUuid(`demo:${seed.key}:lesson:practice-core`);
  await prisma.lesson.upsert({
    where: { id: practiceLessonId },
    update: {
      title: `${seed.proficiencyLevel}: Bài luyện tập tổng hợp`,
      type: LessonType.practice,
      duration: 20,
      order: 50,
      unitId: unitIds[0],
      practiceExerciseSetId: practiceSet.id,
      deletedAt: null,
    },
    create: {
      id: practiceLessonId,
      tenantId,
      courseId: course.id,
      unitId: unitIds[0],
      title: `${seed.proficiencyLevel}: Bài luyện tập tổng hợp`,
      type: LessonType.practice,
      duration: 20,
      order: 50,
      practiceExerciseSetId: practiceSet.id,
    },
  });

  const examId = deterministicUuid(`demo:${seed.key}:exam:mock`);
  const exam = await prisma.exam.upsert({
    where: { id: examId },
    update: {
      title: `${seed.proficiencyLevel} Mock Test`,
      description: `Bài kiểm tra mô phỏng cấu trúc kỹ năng của ${seed.proficiencyLevel}.`,
      durationMinutes: 60,
      passingScore: 60,
      isPublished: true,
      deletedAt: null,
    },
    create: {
      id: examId,
      tenantId,
      courseId: course.id,
      unitId: unitIds[0],
      title: `${seed.proficiencyLevel} Mock Test`,
      description: `Bài kiểm tra mô phỏng cấu trúc kỹ năng của ${seed.proficiencyLevel}.`,
      durationMinutes: 60,
      passingScore: 60,
      isPublished: true,
    },
  });

  for (const sectionSeed of seed.examSections) {
    const section = await prisma.examSection.upsert({
      where: { id: deterministicUuid(`demo:${seed.key}:exam-section:${sectionSeed.key}`) },
      update: { title: sectionSeed.title, order: sectionSeed.order },
      create: {
        id: deterministicUuid(`demo:${seed.key}:exam-section:${sectionSeed.key}`),
        tenantId,
        examId: exam.id,
        title: sectionSeed.title,
        order: sectionSeed.order,
      },
    });
    for (let qOrder = 0; qOrder < sectionSeed.questions.length; qOrder += 1) {
      await upsertExamQuestion(
        tenantId,
        course.id,
        section.id,
        sectionSeed.questions[qOrder],
        qOrder,
      );
    }
  }

  await prisma.lesson.upsert({
    where: { id: deterministicUuid(`demo:${seed.key}:lesson:mock-test`) },
    update: {
      title: `${seed.proficiencyLevel}: Mock test`,
      type: LessonType.exam,
      duration: 60,
      order: 99,
      unitId: unitIds[unitIds.length - 1],
      examId: exam.id,
      deletedAt: null,
    },
    create: {
      id: deterministicUuid(`demo:${seed.key}:lesson:mock-test`),
      tenantId,
      courseId: course.id,
      unitId: unitIds[unitIds.length - 1],
      title: `${seed.proficiencyLevel}: Mock test`,
      type: LessonType.exam,
      duration: 60,
      order: 99,
      examId: exam.id,
    },
  });

  await prisma.courseEnrollment.upsert({
    where: { userId_courseId: { userId: studentId, courseId: course.id } },
    update: { tenantId, status: EnrollmentStatus.ACTIVE, unenrolledAt: null },
    create: { tenantId, userId: studentId, courseId: course.id, status: EnrollmentStatus.ACTIVE },
  });

  const cohort = await prisma.cohort.upsert({
    where: { tenantId_name: { tenantId, name: seed.cohortName } },
    update: {
      instructorId: instructor.id,
      description: `Demo cohort for ${seed.title}`,
      isActive: true,
      deletedAt: null,
    },
    create: {
      tenantId,
      name: seed.cohortName,
      description: `Demo cohort for ${seed.title}`,
      instructorId: instructor.id,
    },
  });

  await prisma.cohortMembership.upsert({
    where: { cohortId_userId: { cohortId: cohort.id, userId: studentId } },
    update: {},
    create: { tenantId, cohortId: cohort.id, userId: studentId },
  });

  const runStatus = seed.runStatus ?? CourseRunStatus.ENROLLING;
  const shouldScheduleRun = runStatus !== CourseRunStatus.DRAFT;
  const startsAt = shouldScheduleRun ? new Date(Date.UTC(2026, 5, 8 + index, 12, 0, 0)) : null;
  const endsAt = shouldScheduleRun ? new Date(Date.UTC(2026, 7, 8 + index, 14, 0, 0)) : null;
  const runDeliveryMode = seed.runDeliveryMode ?? (index % 2 === 0 ? 'online' : 'hybrid');
  const onlineMeetingUrl =
    runDeliveryMode === 'online' || runDeliveryMode === 'hybrid'
      ? `https://meet.example.com/${seed.runCode.toLowerCase()}`
      : null;
  const run = await prisma.courseRun.upsert({
    where: { tenantId_code: { tenantId, code: seed.runCode } },
    update: {
      title: seed.runTitle,
      courseId: course.id,
      cohortId: cohort.id,
      instructorId: instructor.id,
      status: runStatus,
      capacity: seed.runCapacity ?? 24,
      startsAt,
      endsAt,
      deliveryMode: runDeliveryMode,
      onlineMeetingUrl,
      notes: seed.runNotes ?? null,
    },
    create: {
      tenantId,
      courseId: course.id,
      cohortId: cohort.id,
      instructorId: instructor.id,
      title: seed.runTitle,
      code: seed.runCode,
      status: runStatus,
      capacity: seed.runCapacity ?? 24,
      startsAt,
      endsAt,
      timezone: 'Asia/Ho_Chi_Minh',
      deliveryMode: runDeliveryMode,
      onlineMeetingUrl,
      notes: seed.runNotes ?? null,
    },
  });

  await prisma.runEnrollment.upsert({
    where: { runId_userId: { runId: run.id, userId: studentId } },
    update: { status: 'ENROLLED' },
    create: { tenantId, runId: run.id, userId: studentId, status: 'ENROLLED' },
  });

  if (startsAt) {
    for (let sessionIndex = 0; sessionIndex < 3; sessionIndex += 1) {
      const sessionStart = new Date(startsAt.getTime() + sessionIndex * 7 * 24 * 60 * 60 * 1000);
      const sessionEnd = new Date(sessionStart.getTime() + 90 * 60 * 1000);
      const session = await prisma.runSession.upsert({
        where: { id: deterministicUuid(`demo:${seed.key}:session:${sessionIndex}`) },
        update: {
          title: `${seed.proficiencyLevel} Session ${sessionIndex + 1}`,
          startsAt: sessionStart,
          endsAt: sessionEnd,
          instructorId: instructor.id,
          onlineMeetingUrl,
        },
        create: {
          id: deterministicUuid(`demo:${seed.key}:session:${sessionIndex}`),
          tenantId,
          runId: run.id,
          instructorId: instructor.id,
          title: `${seed.proficiencyLevel} Session ${sessionIndex + 1}`,
          startsAt: sessionStart,
          endsAt: sessionEnd,
          timezone: 'Asia/Ho_Chi_Minh',
          onlineMeetingUrl,
        },
      });

      await prisma.attendance.upsert({
        where: { sessionId_userId: { sessionId: session.id, userId: studentId } },
        update: {
          status: sessionIndex === 0 ? AttendanceStatus.PRESENT : AttendanceStatus.EXCUSED,
        },
        create: {
          tenantId,
          sessionId: session.id,
          userId: studentId,
          markedById: instructor.id,
          status: sessionIndex === 0 ? AttendanceStatus.PRESENT : AttendanceStatus.EXCUSED,
        },
      });
    }
  }

  await prisma.activationCode.upsert({
    where: { tenantId_code: { tenantId, code: seed.activationCode } },
    update: {
      description: `Demo activation for ${seed.title}`,
      courseId: course.id,
      maxUses: 100,
      isActive: true,
      deletedAt: null,
    },
    create: {
      tenantId,
      code: seed.activationCode,
      description: `Demo activation for ${seed.title}`,
      courseId: course.id,
      maxUses: 100,
    },
  });

  return { course, instructor };
}

async function seedBillingSamples(tenantId: string) {
  const plan = await prisma.billingPlan.upsert({
    where: { tenantId_code: { tenantId, code: 'PRO_LANGUAGE_CENTER' } },
    update: {
      name: 'Pro Language Center',
      status: BillingPlanStatus.ACTIVE,
      storageQuotaBytes: BigInt(50 * 1024 * 1024 * 1024),
      aiRequestQuota: 20000,
      maxStudents: 1000,
      maxCourses: 80,
    },
    create: {
      tenantId,
      code: 'PRO_LANGUAGE_CENTER',
      name: 'Pro Language Center',
      description: 'Demo production plan with storage, AI quota, and operating limits.',
      status: BillingPlanStatus.ACTIVE,
      storageQuotaBytes: BigInt(50 * 1024 * 1024 * 1024),
      aiRequestQuota: 20000,
      maxStudents: 1000,
      maxCourses: 80,
    },
  });

  const price = await prisma.price.upsert({
    where: { id: deterministicUuid(`demo:${tenantId}:price:pro-language-center`) },
    update: { amountMinor: 4900000, currency: 'VND', interval: 'monthly', isActive: true },
    create: {
      id: deterministicUuid(`demo:${tenantId}:price:pro-language-center`),
      tenantId,
      planId: plan.id,
      amountMinor: 4900000,
      currency: 'VND',
      interval: 'monthly',
      isActive: true,
    },
  });

  const subscription = await prisma.tenantSubscription.upsert({
    where: { id: deterministicUuid(`demo:${tenantId}:subscription:active`) },
    update: {
      planId: plan.id,
      priceId: price.id,
      status: SubscriptionStatus.ACTIVE,
      storageQuotaBytes: BigInt(50 * 1024 * 1024 * 1024),
      aiRequestQuota: 20000,
    },
    create: {
      id: deterministicUuid(`demo:${tenantId}:subscription:active`),
      tenantId,
      planId: plan.id,
      priceId: price.id,
      status: SubscriptionStatus.ACTIVE,
      startsAt: new Date('2026-05-01T00:00:00.000Z'),
      currentPeriodStart: new Date('2026-05-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-06-01T00:00:00.000Z'),
      storageQuotaBytes: BigInt(50 * 1024 * 1024 * 1024),
      aiRequestQuota: 20000,
    },
  });

  const provider = await prisma.paymentProviderAccount.upsert({
    where: {
      tenantId_provider_merchantId: {
        tenantId,
        provider: 'manual',
        merchantId: 'DEMO-MANUAL',
      },
    },
    update: { publicKey: 'manual-demo', isActive: true },
    create: {
      tenantId,
      provider: 'manual',
      merchantId: 'DEMO-MANUAL',
      publicKey: 'manual-demo',
      secretRef: 'render:MANUAL_BILLING_SECRET',
      isActive: true,
    },
  });

  const invoice = await prisma.invoice.upsert({
    where: { tenantId_number: { tenantId, number: 'INV-DEMO-2026-0001' } },
    update: {
      subscriptionId: subscription.id,
      status: InvoiceStatus.PAID,
      subtotalMinor: 4900000,
      taxMinor: 392000,
      totalMinor: 5292000,
      paidAt: new Date('2026-05-02T02:00:00.000Z'),
    },
    create: {
      tenantId,
      subscriptionId: subscription.id,
      number: 'INV-DEMO-2026-0001',
      status: InvoiceStatus.PAID,
      currency: 'VND',
      subtotalMinor: 4900000,
      taxMinor: 392000,
      totalMinor: 5292000,
      dueAt: new Date('2026-05-07T00:00:00.000Z'),
      paidAt: new Date('2026-05-02T02:00:00.000Z'),
    },
  });

  await prisma.invoiceItem.upsert({
    where: { id: deterministicUuid(`demo:${tenantId}:invoice-item:pro-plan`) },
    update: {
      invoiceId: invoice.id,
      priceId: price.id,
      description: 'Pro Language Center monthly subscription',
      quantity: 1,
      unitAmountMinor: 4900000,
      amountMinor: 4900000,
    },
    create: {
      id: deterministicUuid(`demo:${tenantId}:invoice-item:pro-plan`),
      tenantId,
      invoiceId: invoice.id,
      priceId: price.id,
      description: 'Pro Language Center monthly subscription',
      quantity: 1,
      unitAmountMinor: 4900000,
      amountMinor: 4900000,
    },
  });

  await prisma.payment.upsert({
    where: { id: deterministicUuid(`demo:${tenantId}:payment:paid`) },
    update: {
      invoiceId: invoice.id,
      providerAccountId: provider.id,
      status: PaymentStatus.SUCCEEDED,
      amountMinor: 5292000,
      paidAt: new Date('2026-05-02T02:00:00.000Z'),
    },
    create: {
      id: deterministicUuid(`demo:${tenantId}:payment:paid`),
      tenantId,
      invoiceId: invoice.id,
      providerAccountId: provider.id,
      provider: 'manual',
      providerPaymentId: 'PAY-DEMO-0001',
      status: PaymentStatus.SUCCEEDED,
      currency: 'VND',
      amountMinor: 5292000,
      paidAt: new Date('2026-05-02T02:00:00.000Z'),
    },
  });
}

async function main() {
  console.log('Start seeding...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'trung-tam-demo' },
    update: {
      name: 'Trung Tâm Học Tập Demo',
      domain: 'demo.lms.com',
      settings: {
        themeColor: '#ff0000',
        logoUrl: 'https://example.com/logo.png',
      },
    },
    create: {
      name: 'Trung Tâm Học Tập Demo',
      slug: 'trung-tam-demo',
      domain: 'demo.lms.com',
      settings: {
        themeColor: '#ff0000',
        logoUrl: 'https://example.com/logo.png',
      },
    },
  });
  console.log(`Created/Updated Tenant: ${tenant.name}`);

  const hashedPassword = await bcrypt.hash('Demo@12345', 12);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@lms.com' } },
    update: { password: hashedPassword },
    create: {
      email: 'admin@lms.com',
      password: hashedPassword,
      fullName: 'Super Admin',
      role: Role.SUPER_ADMIN,
      tenantId: tenant.id,
    },
  });
  console.log(`Created/Updated Admin User: ${admin.email}`);

  const student = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'student@lms.com' } },
    update: { password: hashedPassword },
    create: {
      email: 'student@lms.com',
      password: hashedPassword,
      fullName: 'Học Viên A',
      role: Role.STUDENT,
      tenantId: tenant.id,
    },
  });
  console.log(`Created/Updated Student User: ${student.email}`);

  const canonicalSkills = [
    {
      code: 'VOCABULARY',
      name: 'Vocabulary',
      nameVi: 'Từ vựng',
      color: '#22c55e',
      sortOrder: 10,
    },
    {
      code: 'GRAMMAR',
      name: 'Grammar',
      nameVi: 'Ngữ pháp',
      color: '#3b82f6',
      sortOrder: 20,
    },
    {
      code: 'READING',
      name: 'Reading',
      nameVi: 'Đọc hiểu',
      color: '#a855f7',
      sortOrder: 30,
    },
    {
      code: 'LISTENING',
      name: 'Listening',
      nameVi: 'Nghe hiểu',
      color: '#f97316',
      sortOrder: 40,
    },
    {
      code: 'WRITING',
      name: 'Writing',
      nameVi: 'Viết',
      color: '#ef4444',
      sortOrder: 50,
    },
  ];
  for (const skill of canonicalSkills) {
    await prisma.skill.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: skill.code } },
      update: {
        name: skill.name,
        nameVi: skill.nameVi,
        color: skill.color,
        sortOrder: skill.sortOrder,
        isActive: true,
        deletedAt: null,
      },
      create: {
        tenantId: tenant.id,
        code: skill.code,
        name: skill.name,
        nameVi: skill.nameVi,
        color: skill.color,
        sortOrder: skill.sortOrder,
      },
    });
  }
  console.log(`Created/Updated ${canonicalSkills.length} canonical skills`);

  await deleteLegacyDemoCourses(tenant.id);

  const bdhvsProgram = await prisma.program.upsert({
    where: { id: deterministicUuid('demo:program:bdhvs') },
    update: {
      title: 'Bình dân học vụ số',
      slug: 'binh-dan-hoc-vu-so',
      description:
        'Các khóa bồi dưỡng kỹ năng số, ứng dụng AI, quản trị nội dung và kinh tế số theo tài liệu tập huấn năm 2026.',
      isActive: true,
      deletedAt: null,
    },
    create: {
      id: deterministicUuid('demo:program:bdhvs'),
      tenantId: tenant.id,
      title: 'Bình dân học vụ số',
      slug: 'binh-dan-hoc-vu-so',
      description:
        'Các khóa bồi dưỡng kỹ năng số, ứng dụng AI, quản trị nội dung và kinh tế số theo tài liệu tập huấn năm 2026.',
    },
  });

  for (let index = 0; index < BDHVS_COURSES.length; index += 1) {
    await seedLanguageCourse({
      tenantId: tenant.id,
      studentId: student.id,
      hashedPassword,
      programId: bdhvsProgram.id,
      seed: BDHVS_COURSES[index],
      index,
    });
  }

  await seedBillingSamples(tenant.id);

  console.log(`Removed legacy demo courses: ${LEGACY_DEMO_COURSE_SLUGS.length}`);
  console.log(`Created/Updated ${BDHVS_COURSES.length} Bình dân học vụ số courses`);
  console.log('Seeding finished.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
