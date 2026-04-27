import {
  PrismaClient,
  Role,
  LessonType,
  EnrollmentStatus,
  PracticeQuestionType,
} from '../.prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'trung-tam-demo' },
    update: {},
    create: {
      name: 'Trung Tam Tieng Trung Demo',
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
      fullName: 'Hoc Vien A',
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
      title: 'Khoa hoc Nhap mon Tieng Trung (HSK 1 - Demo)',
      totalDuration: 30,
      isActive: true,
    },
    create: {
      title: 'Khoa hoc Nhap mon Tieng Trung (HSK 1 - Demo)',
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

  const defaultUnit = await prisma.courseUnit.upsert({
    where: {
      id: `default-unit-${course.id}`,
    },
    update: {
      title: 'Nhap mon',
      order: 0,
      deletedAt: null,
    },
    create: {
      id: `default-unit-${course.id}`,
      title: 'Nhap mon',
      description: 'Cac bai hoc nen tang dau tien.',
      order: 0,
      tenantId: tenant.id,
      courseId: course.id,
    },
  });

  if (existingLessons === 0) {
    await prisma.lesson.createMany({
      data: [
        {
          title: 'Bai 1: Gioi thieu Pinyin',
          type: LessonType.video,
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration: 15,
          order: 1,
          unitId: defaultUnit.id,
          tenantId: tenant.id,
          courseId: course.id,
        },
        {
          title: 'Bai 2: Tu vung co ban',
          type: LessonType.text,
          content:
            '<h2>Chao hoi trong tieng Trung</h2><p>Ni hao (你好) - Xin chao</p><p>Zaijian (再见) - Tam biet</p>',
          duration: 10,
          order: 2,
          unitId: defaultUnit.id,
          tenantId: tenant.id,
          courseId: course.id,
        },
        {
          title: 'Bai 3: Bai tap on tap',
          type: LessonType.quiz,
          duration: 5,
          order: 3,
          unitId: defaultUnit.id,
          tenantId: tenant.id,
          courseId: course.id,
          quiz: {
            questions: [
              {
                question: "Tu 'Xin chao' trong tieng Trung la gi?",
                options: ['Zaijian', 'Ni hao', 'Xiexie', 'Bu keqi'],
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
      id: `practice-question-${course.id}-hello`,
    },
    update: {
      prompt: "Tu 'Xin chao' trong tieng Trung la gi?",
      options: ['Zaijian', 'Ni hao', 'Xiexie', 'Bu keqi'],
      correctAnswer: 1,
      skillTags: ['vocabulary'],
      deletedAt: null,
    },
    create: {
      id: `practice-question-${course.id}-hello`,
      tenantId: tenant.id,
      courseId: course.id,
      unitId: defaultUnit.id,
      type: PracticeQuestionType.MULTIPLE_CHOICE,
      prompt: "Tu 'Xin chao' trong tieng Trung la gi?",
      options: ['Zaijian', 'Ni hao', 'Xiexie', 'Bu keqi'],
      correctAnswer: 1,
      explanation: "'Ni hao' la cach chao co ban trong tieng Trung.",
      skillTags: ['vocabulary'],
    },
  });

  const practiceSet = await prisma.practiceExerciseSet.upsert({
    where: {
      id: `practice-set-${course.id}-intro`,
    },
    update: {
      title: 'Luyen tap tu vung nhap mon',
      isPublished: true,
      deletedAt: null,
    },
    create: {
      id: `practice-set-${course.id}-intro`,
      tenantId: tenant.id,
      courseId: course.id,
      unitId: defaultUnit.id,
      title: 'Luyen tap tu vung nhap mon',
      description: 'Bai luyen tap nhanh cho unit nhap mon.',
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
