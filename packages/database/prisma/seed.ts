import {
  Prisma,
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

type QuestionType = PracticeQuestionType | ExamQuestionType;

interface SampleQuestionSeed {
  key: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: unknown;
  options?: unknown;
  explanation?: string;
  skillTags: string[];
  points?: number;
}

const PRACTICE_SAMPLE_QUESTIONS: SampleQuestionSeed[] = [
  {
    key: 'hello-mc',
    type: PracticeQuestionType.MULTIPLE_CHOICE,
    prompt: "Từ 'Xin chào' trong tiếng Trung là gì?",
    options: ['Zàijiàn', 'Nǐ hǎo', 'Xièxie', 'Bú kèqì'],
    correctAnswer: 1,
    explanation: "'Nǐ hǎo' là cách chào cơ bản trong tiếng Trung.",
    skillTags: ['VOCABULARY'],
  },
  {
    key: 'fill-blank-hanzi',
    type: PracticeQuestionType.FILL_BLANK,
    prompt: "Điền Hán tự cho 'Nǐ hǎo' (Xin chào):",
    correctAnswer: '你好',
    explanation: '你好 là cách viết Hán tự của Nǐ hǎo.',
    skillTags: ['VOCABULARY', 'WRITING'],
  },
  {
    key: 'matching-pinyin',
    type: PracticeQuestionType.MATCHING,
    prompt: 'Nối pinyin với nghĩa tiếng Việt tương ứng:',
    options: {
      left: ['Nǐ hǎo', 'Zàijiàn', 'Xièxie', 'Duìbuqǐ'],
      right: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'],
    },
    correctAnswer: {
      'Nǐ hǎo': 'Xin chào',
      Zàijiàn: 'Tạm biệt',
      Xièxie: 'Cảm ơn',
      Duìbuqǐ: 'Xin lỗi',
    },
    explanation: 'Ghép đúng cặp pinyin – nghĩa để ghi nhớ từ vựng cơ bản.',
    skillTags: ['VOCABULARY', 'LISTENING'],
  },
  {
    key: 'ordering-sentence',
    type: PracticeQuestionType.ORDERING,
    prompt: 'Sắp xếp các từ để tạo câu đúng: "Tôi là học sinh."',
    options: ['是', '学生', '我'],
    correctAnswer: ['我', '是', '学生'],
    explanation: 'Thứ tự chuẩn: 我是学生 (Wǒ shì xuéshēng).',
    skillTags: ['GRAMMAR'],
  },
  {
    key: 'ai-text-intro',
    type: PracticeQuestionType.AI_EVALUATED_TEXT,
    prompt: 'Viết một câu giới thiệu bản thân bằng tiếng Trung (có tên và quốc tịch).',
    correctAnswer: '我叫...我是...人',
    explanation: 'Mẫu tham khảo: 我叫小明。我是越南人。',
    skillTags: ['WRITING'],
  },
  {
    key: 'ai-audio-greeting',
    type: PracticeQuestionType.AI_EVALUATED_AUDIO,
    prompt: 'Ghi âm phát âm chào hỏi "Nǐ hǎo" (你好) rõ ràng.',
    correctAnswer: '你好',
    explanation: 'Phát âm chuẩn hai thanh điệu của 你好.',
    skillTags: ['LISTENING', 'WRITING'],
  },
];

const EXAM_MIXED_SECTIONS: Array<{
  key: string;
  title: string;
  order: number;
  questions: SampleQuestionSeed[];
}> = [
  {
    key: 'mc-fill',
    title: 'Trắc nghiệm & Điền khuyết',
    order: 0,
    questions: [
      {
        key: 'exam-mc-greeting',
        type: ExamQuestionType.MULTIPLE_CHOICE,
        prompt: "'Tạm biệt' trong tiếng Trung là gì?",
        options: ['Nǐ hǎo', 'Zàijiàn', 'Xièxie', 'Míngtiān'],
        correctAnswer: 1,
        explanation: 'Zàijiàn (再见) nghĩa là tạm biệt.',
        skillTags: ['VOCABULARY'],
        points: 2,
      },
      {
        key: 'exam-fill-thanks',
        type: ExamQuestionType.FILL_BLANK,
        prompt: "Điền pinyin cho 'Cảm ơn' (谢谢):",
        correctAnswer: 'xièxie',
        explanation: '谢谢 đọc là xièxie (có thể viết Xièxie).',
        skillTags: ['VOCABULARY'],
        points: 2,
      },
    ],
  },
  {
    key: 'match-order',
    title: 'Nối cặp & Sắp xếp',
    order: 1,
    questions: [
      {
        key: 'exam-matching-numbers',
        type: ExamQuestionType.MATCHING,
        prompt: 'Nối số Hán tự với đọc pinyin:',
        options: {
          left: ['一', '二', '三'],
          right: ['yī', 'èr', 'sān'],
        },
        correctAnswer: { 一: 'yī', 二: 'èr', 三: 'sān' },
        skillTags: ['VOCABULARY', 'READING'],
        points: 3,
      },
      {
        key: 'exam-ordering-time',
        type: ExamQuestionType.ORDERING,
        prompt: 'Sắp xếp các cụm từ mô tả thời gian trong ngày (sáng → trưa → tối):',
        options: ['晚上', '早上', '中午'],
        correctAnswer: ['早上', '中午', '晚上'],
        explanation: '早上 (sáng) → 中午 (trưa) → 晚上 (tối).',
        skillTags: ['VOCABULARY'],
        points: 3,
      },
    ],
  },
  {
    key: 'ai-synthesis',
    title: 'AI & Tổng hợp',
    order: 2,
    questions: [
      {
        key: 'exam-ai-text-polite',
        type: ExamQuestionType.AI_EVALUATED_TEXT,
        prompt: 'Viết câu cảm ơn lịch sự bằng tiếng Trung (dùng 谢谢).',
        correctAnswer: '谢谢',
        skillTags: ['WRITING'],
        points: 2,
      },
      {
        key: 'exam-ai-audio-goodbye',
        type: ExamQuestionType.AI_EVALUATED_AUDIO,
        prompt: 'Ghi âm cách nói "Zàijiàn" (再见) chuẩn thanh điệu.',
        correctAnswer: '再见',
        skillTags: ['LISTENING'],
        points: 2,
      },
      {
        key: 'exam-mc-reading',
        type: ExamQuestionType.MULTIPLE_CHOICE,
        prompt: 'Trong câu 我是学生, từ nào nghĩa là "học sinh"?',
        options: ['我', '是', '学生', '好'],
        correctAnswer: 2,
        skillTags: ['READING', 'GRAMMAR'],
        points: 2,
      },
    ],
  },
];

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
    practiceQuestion: deterministicUuid(`demo:${course.id}:practice-question:hello-mc`),
    practiceSet: deterministicUuid(`demo:${course.id}:practice-set:intro`),
    practiceSetMixed: deterministicUuid(`demo:${course.id}:practice-set:mixed-types`),
    exam: deterministicUuid(`demo:${course.id}:exam:intro`),
    examMixed: deterministicUuid(`demo:${course.id}:exam:mixed-types`),
    examSection: deterministicUuid(`demo:${course.id}:exam-section:intro`),
    examQuestion: deterministicUuid(`demo:${course.id}:exam-question:hello-mc`),
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

  const practiceQuestions = [];
  for (const seed of PRACTICE_SAMPLE_QUESTIONS) {
    const question = await upsertPracticeQuestion(tenant.id, course.id, defaultUnit.id, seed);
    practiceQuestions.push(question);
  }
  const practiceQuestion = practiceQuestions[0];

  const practiceSet = await prisma.practiceExerciseSet.upsert({
    where: { id: demoIds.practiceSet },
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
      description: 'Bài luyện tập nhanh — 1 câu trắc nghiệm.',
      isPublished: true,
    },
  });

  await replacePracticeSetQuestions(tenant.id, practiceSet.id, [practiceQuestion.id]);

  const practiceSetMixed = await prisma.practiceExerciseSet.upsert({
    where: { id: demoIds.practiceSetMixed },
    update: {
      title: 'Bộ luyện tập đa dạng (Demo)',
      description:
        'Gồm đủ 6 dạng: trắc nghiệm, điền khuyết, nối cặp, sắp xếp, AI văn bản, AI âm thanh.',
      isPublished: true,
      deletedAt: null,
    },
    create: {
      id: demoIds.practiceSetMixed,
      tenantId: tenant.id,
      courseId: course.id,
      unitId: defaultUnit.id,
      title: 'Bộ luyện tập đa dạng (Demo)',
      description:
        'Gồm đủ 6 dạng: trắc nghiệm, điền khuyết, nối cặp, sắp xếp, AI văn bản, AI âm thanh.',
      isPublished: true,
    },
  });

  await replacePracticeSetQuestions(
    tenant.id,
    practiceSetMixed.id,
    practiceQuestions.map((q) => q.id),
  );

  const exam = await prisma.exam.upsert({
    where: { id: demoIds.exam },
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
      description: 'Bài kiểm tra mẫu — 1 câu trắc nghiệm.',
      durationMinutes: 15,
      passingScore: 60,
      isPublished: true,
    },
  });

  const examSection = await prisma.examSection.upsert({
    where: { id: demoIds.examSection },
    update: { title: 'Từ vựng', order: 0 },
    create: {
      id: demoIds.examSection,
      tenantId: tenant.id,
      examId: exam.id,
      title: 'Từ vựng',
      order: 0,
    },
  });

  const introMcSeed = PRACTICE_SAMPLE_QUESTIONS[0];
  const introExamQuestionId = deterministicUuid(
    `demo:${course.id}:exam-question:${introMcSeed.key}`,
  );
  await prisma.examQuestion.deleteMany({
    where: {
      sectionId: examSection.id,
      id: { not: introExamQuestionId },
    },
  });
  await upsertExamQuestion(tenant.id, course.id, examSection.id, introMcSeed, 0);

  const examMixed = await prisma.exam.upsert({
    where: { id: demoIds.examMixed },
    update: {
      title: 'Kiểm tra tổng hợp các dạng (Demo)',
      durationMinutes: 45,
      passingScore: 60,
      isPublished: true,
      deletedAt: null,
    },
    create: {
      id: demoIds.examMixed,
      tenantId: tenant.id,
      courseId: course.id,
      unitId: defaultUnit.id,
      title: 'Kiểm tra tổng hợp các dạng (Demo)',
      description:
        'Bài kiểm tra mẫu gồm 3 phần: trắc nghiệm/điền khuyết, nối/sắp xếp, AI & tổng hợp.',
      durationMinutes: 45,
      passingScore: 60,
      isPublished: true,
    },
  });

  for (const sectionSeed of EXAM_MIXED_SECTIONS) {
    const sectionId = deterministicUuid(`demo:${course.id}:exam-section:${sectionSeed.key}`);
    const section = await prisma.examSection.upsert({
      where: { id: sectionId },
      update: { title: sectionSeed.title, order: sectionSeed.order },
      create: {
        id: sectionId,
        tenantId: tenant.id,
        examId: examMixed.id,
        title: sectionSeed.title,
        order: sectionSeed.order,
      },
    });

    for (let qOrder = 0; qOrder < sectionSeed.questions.length; qOrder += 1) {
      await upsertExamQuestion(
        tenant.id,
        course.id,
        section.id,
        sectionSeed.questions[qOrder],
        qOrder,
      );
    }
  }

  console.log(
    `Seeded ${practiceQuestions.length} practice questions and ${EXAM_MIXED_SECTIONS.reduce((n, s) => n + s.questions.length, 0) + 1} exam questions`,
  );

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
