import { PrismaClient, LessonType } from '../.prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding 4 languages...');

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('Tenant not found');

  const student = await prisma.user.findFirst({ where: { email: 'student@lms.com' } });
  if (!student) throw new Error('Student not found');

  // Xóa tất cả khóa học cũ (cascade delete sẽ xóa luôn lesson, practice set, exam)
  console.log('Xóa các khóa học demo cũ...');
  await prisma.course.deleteMany({
    where: { tenantId: tenant.id },
  });

  const languages = [
    { slug: 'tieng-trung-hsk1', title: 'Tiếng Trung HSK 1' },
    { slug: 'tieng-nhat-n5', title: 'Tiếng Nhật N5' },
    { slug: 'tieng-han-so-cap', title: 'Tiếng Hàn Sơ Cấp' },
    { slug: 'tieng-anh-giao-tiep', title: 'Tiếng Anh Giao Tiếp' },
  ];

  for (const lang of languages) {
    const course = await prisma.course.create({
      data: {
        title: lang.title,
        slug: lang.slug,
        tenantId: tenant.id,
        totalDuration: 50,
        isActive: true,
      },
    });

    const defaultUnit = await prisma.courseUnit.create({
      data: {
        title: 'Nhập môn ' + lang.title,
        description: 'Bài học cơ bản',
        order: 0,
        tenantId: tenant.id,
        courseId: course.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: 'Bài 1: Giới thiệu',
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
          content: '<h2>Từ vựng</h2><p>Xin chào, Cảm ơn...</p>',
          duration: 10,
          order: 2,
          unitId: defaultUnit.id,
          tenantId: tenant.id,
          courseId: course.id,
        },
      ],
    });

    const practiceSet = await prisma.practiceExerciseSet.create({
      data: {
        tenantId: tenant.id,
        courseId: course.id,
        unitId: defaultUnit.id,
        title: 'Luyện tập ' + lang.title,
        description: 'Bài luyện tập tổng hợp',
        isPublished: true,
      },
    });

    await prisma.lesson.create({
      data: {
        title: 'Bài 3: Luyện tập',
        type: LessonType.practice,
        duration: 20,
        order: 3,
        unitId: defaultUnit.id,
        tenantId: tenant.id,
        courseId: course.id,
        practiceExerciseSetId: practiceSet.id,
      },
    });

    await prisma.activationCode.create({
      data: {
        tenantId: tenant.id,
        code: `DEMO-${lang.slug.toUpperCase()}`,
        description: `Mã kích hoạt khóa học ${lang.title}`,
        maxUses: 100,
        courseId: course.id,
        isActive: true,
      },
    });

    // Enroll student in all 4 for demo purposes? Or let them use activation codes?
    // The user wants activation codes to TEST. So maybe don't enroll them by default?
    // If not enrolled, they can test entering the code.
  }

  console.log('Seeding finished.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
