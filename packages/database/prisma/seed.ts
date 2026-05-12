import {
  PrismaClient,
  Role,
  LessonType,
  EnrollmentStatus,
  PracticeQuestionType,
  ExamQuestionType,
} from '../.prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

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

async function migrateLegacyDemoIds(courseId: string, ids: Record<string, string>) {
  const legacyIds = {
    defaultUnit: `default-unit-${courseId}`,
    practiceQuestion: `practice-question-${courseId}-hello`,
    practiceSet: `practice-set-${courseId}-intro`,
    exam: `exam-${courseId}-intro`,
    examSection: `exam-section-${courseId}-intro`,
    examQuestion: `exam-question-${courseId}-hello`,
  };

  if (!(await prisma.courseUnit.findUnique({ where: { id: ids.defaultUnit } }))) {
    await prisma.courseUnit.updateMany({
      where: { id: legacyIds.defaultUnit },
      data: { id: ids.defaultUnit },
    });
  }
  if (!(await prisma.practiceQuestion.findUnique({ where: { id: ids.practiceQuestion } }))) {
    await prisma.practiceQuestion.updateMany({
      where: { id: legacyIds.practiceQuestion },
      data: { id: ids.practiceQuestion },
    });
  }
  if (!(await prisma.practiceExerciseSet.findUnique({ where: { id: ids.practiceSet } }))) {
    await prisma.practiceExerciseSet.updateMany({
      where: { id: legacyIds.practiceSet },
      data: { id: ids.practiceSet },
    });
  }
  if (!(await prisma.exam.findUnique({ where: { id: ids.exam } }))) {
    await prisma.exam.updateMany({
      where: { id: legacyIds.exam },
      data: { id: ids.exam },
    });
  }
  if (!(await prisma.examSection.findUnique({ where: { id: ids.examSection } }))) {
    await prisma.examSection.updateMany({
      where: { id: legacyIds.examSection },
      data: { id: ids.examSection },
    });
  }
  if (!(await prisma.examQuestion.findUnique({ where: { id: ids.examQuestion } }))) {
    await prisma.examQuestion.updateMany({
      where: { id: legacyIds.examQuestion },
      data: { id: ids.examQuestion },
    });
  }
}

async function main() {
  console.log('Start seeding...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'trung-tam-demo' },
    update: {},
    create: {
      name: 'Trung Tâm Tiếng Trung Demo',
      slug: 'trung-tam-demo',
      domain: 'demo.lms.com',
      settings: {
        themeColor: '#ff0000',
        logoUrl: 'https://example.com/logo.png',
      },
    },
  });
  console.log(`Created/Updated Tenant: ${tenant.name}`);

  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@lms.com' } },
    update: {},
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
    update: {},
    create: {
      email: 'student@lms.com',
      password: hashedPassword,
      fullName: 'Học Viên A',
      role: Role.STUDENT,
      tenantId: tenant.id,
    },
  });
  console.log(`Created/Updated Student User: ${student.email}`);

  const course = await prisma.course.upsert({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug: 'hsk-1-demo',
      },
    },
    update: {
      title: 'Khóa học Nhập môn Tiếng Trung (HSK 1 - Demo)',
      totalDuration: 30,
      isActive: true,
    },
    create: {
      title: 'Khóa học Nhập môn Tiếng Trung (HSK 1 - Demo)',
      slug: 'hsk-1-demo',
      tenantId: tenant.id,
      totalDuration: 30,
    },
  });

  const existingLessons = await prisma.lesson.count({
    where: {
      courseId: course.id,
      tenantId: tenant.id,
      deletedAt: null,
    },
  });

  const demoIds = {
    defaultUnit: deterministicUuid(`demo:${course.id}:default-unit`),
    practiceQuestion: deterministicUuid(`demo:${course.id}:practice-question:hello`),
    practiceSet: deterministicUuid(`demo:${course.id}:practice-set:intro`),
    exam: deterministicUuid(`demo:${course.id}:exam:intro`),
    examSection: deterministicUuid(`demo:${course.id}:exam-section:intro`),
    examQuestion: deterministicUuid(`demo:${course.id}:exam-question:hello`),
  };
  await migrateLegacyDemoIds(course.id, demoIds);

  const defaultUnit = await prisma.courseUnit.upsert({
    where: {
      id: demoIds.defaultUnit,
    },
    update: {
      title: 'Nhập môn',
      order: 0,
      deletedAt: null,
    },
    create: {
      id: demoIds.defaultUnit,
      title: 'Nhập môn',
      description: 'Các bài học nền tảng đầu tiên.',
      order: 0,
      tenantId: tenant.id,
      courseId: course.id,
    },
  });

  if (existingLessons === 0) {
    await prisma.lesson.createMany({
      data: [
        {
          title: 'Bài 1: Giới thiệu Pinyin',
          type: LessonType.video,
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration: 15,
          order: 1,
          unitId: defaultUnit.id,
          tenantId: tenant.id,
          courseId: course.id,
        },
        {
          title: 'Bài 2: Từ vựng cơ bản',
          type: LessonType.text,
          content:
            '<h2>Chào hỏi trong tiếng Trung</h2><p>Nǐ hǎo (你好) - Xin chào</p><p>Zàijiàn (再见) - Tạm biệt</p>',
          duration: 10,
          order: 2,
          unitId: defaultUnit.id,
          tenantId: tenant.id,
          courseId: course.id,
        },
        {
          title: 'Bài 3: Bài tập ôn tập',
          type: LessonType.quiz,
          duration: 5,
          order: 3,
          unitId: defaultUnit.id,
          tenantId: tenant.id,
          courseId: course.id,
          quiz: {
            questions: [
              {
                question: "Từ 'Xin chào' trong tiếng Trung là gì?",
                options: ['Zàijiàn', 'Nǐ hǎo', 'Xièxie', 'Bú kèqì'],
                correctAnswer: 1,
              },
            ],
          },
        },
      ],
    });
  }

  const practiceQuestion = await prisma.practiceQuestion.upsert({
    where: {
      id: demoIds.practiceQuestion,
    },
    update: {
      prompt: "Từ 'Xin chào' trong tiếng Trung là gì?",
      options: ['Zàijiàn', 'Nǐ hǎo', 'Xièxie', 'Bú kèqì'],
      correctAnswer: 1,
      skillTags: ['vocabulary'],
      deletedAt: null,
    },
    create: {
      id: demoIds.practiceQuestion,
      tenantId: tenant.id,
      courseId: course.id,
      unitId: defaultUnit.id,
      type: PracticeQuestionType.MULTIPLE_CHOICE,
      prompt: "Từ 'Xin chào' trong tiếng Trung là gì?",
      options: ['Zàijiàn', 'Nǐ hǎo', 'Xièxie', 'Bú kèqì'],
      correctAnswer: 1,
      explanation: "'Nǐ hǎo' là cách chào cơ bản trong tiếng Trung.",
      skillTags: ['vocabulary'],
    },
  });

  const practiceSet = await prisma.practiceExerciseSet.upsert({
    where: {
      id: demoIds.practiceSet,
    },
    update: {
      title: 'Luyện tập từ vựng nhập môn',
      isPublished: true,
      deletedAt: null,
    },
    create: {
      id: demoIds.practiceSet,
      tenantId: tenant.id,
      courseId: course.id,
      unitId: defaultUnit.id,
      title: 'Luyện tập từ vựng nhập môn',
      description: 'Bài luyện tập nhanh cho unit nhập môn.',
      isPublished: true,
    },
  });

  await prisma.practiceExerciseSetQuestion.upsert({
    where: {
      exerciseSetId_questionId: {
        exerciseSetId: practiceSet.id,
        questionId: practiceQuestion.id,
      },
    },
    update: { order: 0 },
    create: {
      tenantId: tenant.id,
      exerciseSetId: practiceSet.id,
      questionId: practiceQuestion.id,
      order: 0,
    },
  });

  const exam = await prisma.exam.upsert({
    where: {
      id: demoIds.exam,
    },
    update: {
      title: 'Kiểm tra nhanh nhập môn',
      durationMinutes: 15,
      passingScore: 60,
      isPublished: true,
      deletedAt: null,
    },
    create: {
      id: demoIds.exam,
      tenantId: tenant.id,
      courseId: course.id,
      unitId: defaultUnit.id,
      title: 'Kiểm tra nhanh nhập môn',
      description: 'Bài kiểm tra mẫu cho unit nhập môn.',
      durationMinutes: 15,
      passingScore: 60,
      isPublished: true,
    },
  });

  const examSection = await prisma.examSection.upsert({
    where: {
      id: demoIds.examSection,
    },
    update: {
      title: 'Từ vựng',
      order: 0,
    },
    create: {
      id: demoIds.examSection,
      tenantId: tenant.id,
      examId: exam.id,
      title: 'Từ vựng',
      order: 0,
    },
  });

  await prisma.examQuestion.upsert({
    where: {
      id: demoIds.examQuestion,
    },
    update: {
      prompt: "Từ 'Xin chào' trong tiếng Trung là gì?",
      options: ['Zàijiàn', 'Nǐ hǎo', 'Xièxie', 'Bú kèqì'],
      correctAnswer: 1,
      points: 1,
      skillTags: ['vocabulary'],
    },
    create: {
      id: demoIds.examQuestion,
      tenantId: tenant.id,
      sectionId: examSection.id,
      type: ExamQuestionType.MULTIPLE_CHOICE,
      prompt: "Từ 'Xin chào' trong tiếng Trung là gì?",
      options: ['Zàijiàn', 'Nǐ hǎo', 'Xièxie', 'Bú kèqì'],
      correctAnswer: 1,
      explanation: "'Nǐ hǎo' là cách chào cơ bản trong tiếng Trung.",
      points: 1,
      skillTags: ['vocabulary'],
      order: 0,
    },
  });

  await prisma.courseEnrollment.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course.id,
      },
    },
    update: {
      status: EnrollmentStatus.ACTIVE,
      tenantId: tenant.id,
      unenrolledAt: null,
    },
    create: {
      userId: student.id,
      courseId: course.id,
      tenantId: tenant.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  console.log(`Created/Updated Course: ${course.title}`);
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
