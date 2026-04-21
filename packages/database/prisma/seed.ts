import { PrismaClient, Role, LessonType } from '../.prisma/client';
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
    where: { email: 'admin@lms.com' },
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
    where: { email: 'student@lms.com' },
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

  if (existingLessons === 0) {
    await prisma.lesson.createMany({
      data: [
        {
          title: 'Bai 1: Gioi thieu Pinyin',
          type: LessonType.video,
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration: 15,
          order: 1,
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
          tenantId: tenant.id,
          courseId: course.id,
        },
        {
          title: 'Bai 3: Bai tap on tap',
          type: LessonType.quiz,
          duration: 5,
          order: 3,
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
