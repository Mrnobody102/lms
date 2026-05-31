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
    key: 'collaborate-mc',
    type: PracticeQuestionType.MULTIPLE_CHOICE,
    prompt: "Which word best means 'work together'?",
    options: ['Compete', 'Collaborate', 'Ignore', 'Delay'],
    correctAnswer: 1,
    explanation: "'Collaborate' means to work together toward a shared goal.",
    skillTags: ['VOCABULARY'],
  },
  {
    key: 'fill-blank-phrase',
    type: PracticeQuestionType.FILL_BLANK,
    prompt: "Complete the phrase: 'make a strong ___'",
    correctAnswer: 'argument',
    explanation: "The common collocation is 'make a strong argument'.",
    skillTags: ['VOCABULARY', 'WRITING'],
  },
  {
    key: 'matching-vocabulary',
    type: PracticeQuestionType.MATCHING,
    prompt: 'Match each academic word with its meaning:',
    options: {
      left: ['Analyze', 'Summarize', 'Compare', 'Predict'],
      right: [
        'Break down in detail',
        'Give the main points',
        'Find similarities and differences',
        'Say what may happen',
      ],
    },
    correctAnswer: {
      Analyze: 'Break down in detail',
      Summarize: 'Give the main points',
      Compare: 'Find similarities and differences',
      Predict: 'Say what may happen',
    },
    explanation: 'Matching terms with meanings helps build durable vocabulary recall.',
    skillTags: ['VOCABULARY', 'LISTENING'],
  },
  {
    key: 'ordering-sentence',
    type: PracticeQuestionType.ORDERING,
    prompt: 'Order the words to form a correct sentence: "I need more practice."',
    options: ['more', 'practice', 'I', 'need'],
    correctAnswer: ['I', 'need', 'more', 'practice'],
    explanation: 'Standard English word order is subject + verb + object/complement.',
    skillTags: ['GRAMMAR'],
  },
  {
    key: 'ai-text-intro',
    type: PracticeQuestionType.AI_EVALUATED_TEXT,
    prompt: 'Write one sentence introducing yourself and your learning goal.',
    correctAnswer: 'My name is... I want to improve...',
    explanation: 'A strong answer includes who you are and a specific learning goal.',
    skillTags: ['WRITING'],
  },
  {
    key: 'ai-audio-greeting',
    type: PracticeQuestionType.AI_EVALUATED_AUDIO,
    prompt: 'Record yourself saying: "I would like to improve my pronunciation."',
    correctAnswer: 'I would like to improve my pronunciation.',
    explanation: 'Speak clearly, keep a steady pace, and pronounce key sounds accurately.',
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
        prompt: 'Which phrase is the most polite way to close a formal email?',
        options: ['See ya', 'Best regards', 'Later', 'No problem'],
        correctAnswer: 1,
        explanation: "'Best regards' is a common polite email closing.",
        skillTags: ['VOCABULARY'],
        points: 2,
      },
      {
        key: 'exam-fill-thanks',
        type: ExamQuestionType.FILL_BLANK,
        prompt: "Complete the phrase: 'Thank you for your ___.'",
        correctAnswer: 'support',
        explanation: "'Thank you for your support' is a common polite phrase.",
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
        prompt: 'Match each transition word with its function:',
        options: {
          left: ['However', 'Therefore', 'For example'],
          right: ['Contrast', 'Result', 'Illustration'],
        },
        correctAnswer: { However: 'Contrast', Therefore: 'Result', 'For example': 'Illustration' },
        skillTags: ['VOCABULARY', 'READING'],
        points: 3,
      },
      {
        key: 'exam-ordering-time',
        type: ExamQuestionType.ORDERING,
        prompt: 'Order the presentation structure from beginning to end:',
        options: ['Conclusion', 'Introduction', 'Main points'],
        correctAnswer: ['Introduction', 'Main points', 'Conclusion'],
        explanation:
          'A clear presentation usually starts with an introduction, develops main points, and ends with a conclusion.',
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
        prompt: 'Write a polite sentence thanking someone for their feedback.',
        correctAnswer: 'Thank you for your helpful feedback.',
        skillTags: ['WRITING'],
        points: 2,
      },
      {
        key: 'exam-ai-audio-goodbye',
        type: ExamQuestionType.AI_EVALUATED_AUDIO,
        prompt: 'Record yourself saying: "Thank you for your helpful feedback."',
        correctAnswer: 'Thank you for your helpful feedback.',
        skillTags: ['LISTENING'],
        points: 2,
      },
      {
        key: 'exam-mc-reading',
        type: ExamQuestionType.MULTIPLE_CHOICE,
        prompt: 'In the sentence "The proposal is concise", which word means "brief and clear"?',
        options: ['proposal', 'is', 'concise', 'the'],
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

interface DemoLessonSeed {
  key: string;
  title: string;
  type?: LessonType;
  content?: string;
  duration?: number;
}

interface DemoUnitSeed {
  key: string;
  title: string;
  description: string;
  lessons: DemoLessonSeed[];
}

interface DemoCourseSeed {
  key: string;
  title: string;
  slug: string;
  description: string;
  languageCode: string;
  proficiencyLevel: string;
  coverImageUrl: string;
  instructorEmail: string;
  instructorName: string;
  instructorSubject: string;
  instructorLevelRange: string;
  cohortName: string;
  runTitle: string;
  runCode: string;
  activationCode: string;
  units: DemoUnitSeed[];
  practiceQuestions: SampleQuestionSeed[];
  examSections: Array<{
    key: string;
    title: string;
    order: number;
    questions: SampleQuestionSeed[];
  }>;
}

const DEMO_COURSES: DemoCourseSeed[] = [
  {
    key: 'jlpt-n4',
    title: 'Tiếng Nhật JLPT N4',
    slug: 'tieng-nhat-jlpt-n4',
    description:
      'Lộ trình JLPT N4 tập trung từ vựng, ngữ pháp căn bản, đọc hiểu đoạn ngắn và nghe tình huống đời sống.',
    languageCode: 'ja',
    proficiencyLevel: 'JLPT N4',
    coverImageUrl:
      'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1200&q=80',
    instructorEmail: 'sensei.n4@example.com',
    instructorName: 'Nguyễn Minh Nhật',
    instructorSubject: 'Japanese',
    instructorLevelRange: 'JLPT N5-N3',
    cohortName: 'JLPT N4 Evening 01',
    runTitle: 'Lớp JLPT N4 buổi tối',
    runCode: 'RUN-JLPT-N4-EVE',
    activationCode: 'DEMO-JLPT-N4',
    units: [
      {
        key: 'vocab',
        title: 'Từ vựng & Kanji N4',
        description: 'Từ vựng sinh hoạt, trường học, công việc và kanji thường gặp.',
        lessons: [
          {
            key: 'daily-vocab',
            title: 'Bài 1: Từ vựng sinh hoạt hằng ngày',
            content:
              '<h2>Từ vựng sinh hoạt</h2><p>覚える: ghi nhớ, 遅れる: đến muộn, 連絡する: liên lạc.</p>',
          },
          {
            key: 'kanji-context',
            title: 'Bài 2: Đọc Kanji theo ngữ cảnh',
            content: '<p>Luyện đọc biển báo, tin nhắn ngắn và lịch làm việc.</p>',
          },
        ],
      },
      {
        key: 'grammar-reading',
        title: 'Ngữ pháp & Đọc hiểu',
        description: 'Mẫu câu N4 và chiến thuật đọc đoạn ngắn.',
        lessons: [
          {
            key: 'grammar-te-oku',
            title: 'Bài 3: 〜ておく và chuẩn bị trước',
            content: '<p>Dùng 〜ておく để nói về việc làm trước cho mục đích sau này.</p>',
          },
          {
            key: 'short-reading',
            title: 'Bài 4: Đọc thông báo ngắn',
            content: '<p>Xác định thời gian, địa điểm, người thực hiện hành động.</p>',
          },
        ],
      },
      {
        key: 'listening',
        title: 'Nghe tình huống',
        description: 'Nghe hội thoại ngắn ở cửa hàng, nhà ga và lớp học.',
        lessons: [
          {
            key: 'listening-station',
            title: 'Bài 5: Nghe thông báo ở nhà ga',
            content: '<p>Tập bắt từ khóa về thời gian, sân ga và hướng di chuyển.</p>',
          },
        ],
      },
    ],
    practiceQuestions: [
      {
        key: 'n4-vocab-okureru',
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        prompt: '「遅れる」の意味として正しいものはどれですか。',
        options: ['đến sớm', 'đến muộn', 'nghỉ học', 'liên lạc'],
        correctAnswer: 1,
        explanation: '遅れる nghĩa là đến muộn hoặc bị trễ.',
        skillTags: ['VOCABULARY'],
      },
      {
        key: 'n4-grammar-teoku',
        type: PracticeQuestionType.FILL_BLANK,
        prompt: '明日のために、資料を読んで___。',
        correctAnswer: 'おきます',
        explanation: '〜ておく diễn tả chuẩn bị trước.',
        skillTags: ['GRAMMAR'],
      },
    ],
    examSections: [
      {
        key: 'language-knowledge',
        title: '文字・語彙・文法',
        order: 0,
        questions: [
          {
            key: 'n4-exam-mc',
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: '「連絡する」に近い意味はどれですか。',
            options: ['nghỉ ngơi', 'liên lạc', 'mua sắm', 'giải thích'],
            correctAnswer: 1,
            skillTags: ['VOCABULARY'],
            points: 2,
          },
        ],
      },
      {
        key: 'reading',
        title: '読解',
        order: 1,
        questions: [
          {
            key: 'n4-reading-notice',
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt:
              'Một thông báo ghi: "Buổi học đổi sang phòng 302 lúc 19:00." Thông tin cần nhớ là gì?',
            options: ['Tên giáo viên', 'Phòng và giờ học', 'Ngày thi', 'Số điện thoại'],
            correctAnswer: 1,
            skillTags: ['READING'],
            points: 2,
          },
        ],
      },
    ],
  },
  {
    key: 'hsk4',
    title: 'Tiếng Trung HSK4',
    slug: 'tieng-trung-hsk4',
    description:
      'Khóa HSK4 luyện nghe, đọc và viết câu ngắn theo các chủ đề công việc, học tập và đời sống.',
    languageCode: 'zh',
    proficiencyLevel: 'HSK4',
    coverImageUrl:
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80',
    instructorEmail: 'laoshi.hsk4@example.com',
    instructorName: 'Trần Bảo Châu',
    instructorSubject: 'Chinese',
    instructorLevelRange: 'HSK3-HSK5',
    cohortName: 'HSK4 Weekend 01',
    runTitle: 'Lớp HSK4 cuối tuần',
    runCode: 'RUN-HSK4-WKD',
    activationCode: 'DEMO-HSK4',
    units: [
      {
        key: 'listening',
        title: 'Nghe HSK4',
        description: 'Nhận diện ý chính, thái độ và thông tin chi tiết trong hội thoại.',
        lessons: [
          {
            key: 'work-dialogue',
            title: 'Bài 1: Hội thoại công việc',
            content: '<p>Luyện nghe các mẫu câu về họp, deadline và sắp xếp lịch.</p>',
          },
        ],
      },
      {
        key: 'reading',
        title: 'Đọc hiểu',
        description: 'Đọc đoạn ngắn và chọn đáp án theo ngữ cảnh.',
        lessons: [
          {
            key: 'connectors',
            title: 'Bài 2: Liên từ thường gặp',
            content: '<p>虽然、但是、因为、所以 dùng để nối logic trong câu.</p>',
          },
        ],
      },
      {
        key: 'writing',
        title: 'Viết câu',
        description: 'Sắp xếp từ thành câu đúng và mô tả tranh ngắn.',
        lessons: [
          {
            key: 'sentence-order',
            title: 'Bài 3: Sắp xếp thành câu',
            content: '<p>Chú ý trật tự chủ ngữ, thời gian, địa điểm, động từ.</p>',
          },
        ],
      },
    ],
    practiceQuestions: [
      {
        key: 'hsk4-connectors',
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        prompt: 'Chọn cặp liên từ phù hợp: ___ 今天很忙，___ 他还是来上课了。',
        options: ['因为 / 所以', '虽然 / 但是', '如果 / 就', '一边 / 一边'],
        correctAnswer: 1,
        explanation: '虽然...但是... diễn tả nhượng bộ.',
        skillTags: ['GRAMMAR'],
      },
      {
        key: 'hsk4-order',
        type: PracticeQuestionType.ORDERING,
        prompt: 'Sắp xếp thành câu đúng.',
        options: ['我', '把', '作业', '做完了'],
        correctAnswer: ['我', '把', '作业', '做完了'],
        skillTags: ['WRITING'],
      },
    ],
    examSections: [
      {
        key: 'listening-reading',
        title: '听力与阅读',
        order: 0,
        questions: [
          {
            key: 'hsk4-main-idea',
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: 'Đoạn hội thoại nói người học đến muộn vì kẹt xe. Nguyên nhân đến muộn là gì?',
            options: ['ốm', 'kẹt xe', 'mưa lớn', 'quên lịch'],
            correctAnswer: 1,
            skillTags: ['LISTENING'],
            points: 2,
          },
        ],
      },
      {
        key: 'writing',
        title: '书写',
        order: 1,
        questions: [
          {
            key: 'hsk4-writing-order',
            type: ExamQuestionType.ORDERING,
            prompt: 'Sắp xếp: 会议 / 下午 / 三点 / 开始',
            options: ['会议', '下午', '三点', '开始'],
            correctAnswer: ['会议', '下午', '三点', '开始'],
            skillTags: ['WRITING'],
            points: 3,
          },
        ],
      },
    ],
  },
  {
    key: 'topik-ii',
    title: 'Tiếng Hàn TOPIK II',
    slug: 'tieng-han-topik-ii',
    description:
      'Luyện TOPIK II với trọng tâm nghe hiểu, đọc hiểu học thuật và viết đoạn/câu theo yêu cầu.',
    languageCode: 'ko',
    proficiencyLevel: 'TOPIK II',
    coverImageUrl:
      'https://images.unsplash.com/photo-1538485399081-7c8fce85d8e4?auto=format&fit=crop&w=1200&q=80',
    instructorEmail: 'teacher.topik@example.com',
    instructorName: 'Lê Hana',
    instructorSubject: 'Korean',
    instructorLevelRange: 'TOPIK I-II',
    cohortName: 'TOPIK II Writing 01',
    runTitle: 'Lớp TOPIK II trọng tâm viết',
    runCode: 'RUN-TOPIK-II-WR',
    activationCode: 'DEMO-TOPIK-II',
    units: [
      {
        key: 'listening',
        title: 'Nghe TOPIK II',
        description: 'Nghe hội thoại dài, bài nói ngắn và suy luận ý chính.',
        lessons: [
          {
            key: 'topic-opinion',
            title: 'Bài 1: Nhận diện quan điểm người nói',
            content: '<p>Tập phân biệt ý kiến, lý do và ví dụ hỗ trợ trong bài nghe.</p>',
          },
        ],
      },
      {
        key: 'writing',
        title: 'Viết TOPIK II',
        description: 'Hoàn thành câu, viết biểu đồ và đoạn nghị luận ngắn.',
        lessons: [
          {
            key: 'graph-writing',
            title: 'Bài 2: Mô tả biểu đồ',
            content: '<p>Dùng tăng/giảm, so sánh và kết luận ngắn gọn.</p>',
          },
        ],
      },
      {
        key: 'reading',
        title: 'Đọc hiểu TOPIK II',
        description: 'Đọc đoạn học thuật và tìm logic lập luận.',
        lessons: [
          {
            key: 'reading-logic',
            title: 'Bài 3: Xác định câu nối',
            content: '<p>Chú ý từ nối nguyên nhân, tương phản và kết quả.</p>',
          },
        ],
      },
    ],
    practiceQuestions: [
      {
        key: 'topik-connective',
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        prompt: 'Chọn từ nối phù hợp cho quan hệ tương phản trong đoạn văn.',
        options: ['그래서', '그러나', '왜냐하면', '그리고'],
        correctAnswer: 1,
        skillTags: ['READING', 'GRAMMAR'],
      },
      {
        key: 'topik-writing',
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        prompt: 'Viết 2 câu tiếng Hàn mô tả xu hướng tăng trong biểu đồ số lượng học viên.',
        correctAnswer: '학생 수가 증가했습니다. 특히 2025년에 가장 많이 늘었습니다.',
        skillTags: ['WRITING'],
      },
    ],
    examSections: [
      {
        key: 'reading-writing',
        title: '읽기와 쓰기',
        order: 0,
        questions: [
          {
            key: 'topik-reading',
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt:
              'Một đoạn văn đưa ra vấn đề rồi nêu giải pháp. Câu cần chọn nên có chức năng gì?',
            options: [
              'Mở chủ đề mới',
              'Nối vấn đề với giải pháp',
              'Kết thúc đột ngột',
              'Đổi nhân vật',
            ],
            correctAnswer: 1,
            skillTags: ['READING'],
            points: 2,
          },
          {
            key: 'topik-ai-writing',
            type: ExamQuestionType.AI_EVALUATED_TEXT,
            prompt: 'Viết đoạn ngắn 80-120 chữ về lợi ích của học ngoại ngữ trực tuyến.',
            correctAnswer: '온라인 외국어 학습은 시간과 장소의 제약을 줄여 준다...',
            skillTags: ['WRITING'],
            points: 5,
          },
        ],
      },
    ],
  },
  {
    key: 'advanced-english-conversation',
    title: 'Advanced English Conversation',
    slug: 'advanced-english-conversation',
    description:
      'Khóa giao tiếp tiếng Anh nâng cao cho thảo luận, phản biện, trình bày và tình huống công việc.',
    languageCode: 'en',
    proficiencyLevel: 'B2+/C1',
    coverImageUrl:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    instructorEmail: 'coach.english@example.com',
    instructorName: 'Phạm Anh Khoa',
    instructorSubject: 'English Communication',
    instructorLevelRange: 'B2-C1',
    cohortName: 'Advanced Speaking 01',
    runTitle: 'Advanced English Speaking Lab',
    runCode: 'RUN-ADV-ENG-SPK',
    activationCode: 'DEMO-ADV-ENGLISH',
    units: [
      {
        key: 'discussion',
        title: 'Structured Discussion',
        description: 'Build arguments, clarify opinions, and respond naturally.',
        lessons: [
          {
            key: 'opinion-framing',
            title: 'Lesson 1: Framing nuanced opinions',
            content: '<p>Use hedging, contrast, and evidence to make opinions sound precise.</p>',
          },
        ],
      },
      {
        key: 'presentation',
        title: 'Presentation & Q&A',
        description: 'Present ideas, handle follow-up questions, and summarize decisions.',
        lessons: [
          {
            key: 'qa-handling',
            title: 'Lesson 2: Handling challenging questions',
            content: '<p>Clarify, bridge, answer, and confirm the listener’s concern.</p>',
          },
        ],
      },
      {
        key: 'workplace',
        title: 'Workplace Scenarios',
        description: 'Practice negotiation, feedback, alignment and conflict resolution.',
        lessons: [
          {
            key: 'feedback',
            title: 'Lesson 3: Giving diplomatic feedback',
            content: '<p>Use specific observations, impact, and collaborative next steps.</p>',
          },
        ],
      },
    ],
    practiceQuestions: [
      {
        key: 'advanced-hedging',
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        prompt: 'Which phrase best softens a disagreement in a professional discussion?',
        options: [
          'You are wrong.',
          'That makes no sense.',
          'I see your point, though I would add...',
          'No way.',
        ],
        correctAnswer: 2,
        skillTags: ['VOCABULARY', 'SPEAKING'],
      },
      {
        key: 'advanced-speaking',
        type: PracticeQuestionType.AI_EVALUATED_AUDIO,
        prompt:
          'Record a 45-second response agreeing partially with a proposal and adding one concern.',
        correctAnswer: 'I agree with the main direction, although I would be careful about...',
        skillTags: ['LISTENING', 'WRITING'],
      },
    ],
    examSections: [
      {
        key: 'speaking-workplace',
        title: 'Speaking & Workplace Communication',
        order: 0,
        questions: [
          {
            key: 'advanced-tone',
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: 'Which response is most appropriate when you need more data before agreeing?',
            options: [
              'I cannot decide because this is bad.',
              'Could we review the data before we commit?',
              'Let us stop the meeting.',
              'You should know already.',
            ],
            correctAnswer: 1,
            skillTags: ['VOCABULARY'],
            points: 2,
          },
          {
            key: 'advanced-ai-text',
            type: ExamQuestionType.AI_EVALUATED_TEXT,
            prompt: 'Write a concise meeting summary with one decision and one open question.',
            correctAnswer: 'We agreed to pilot the new onboarding flow. The open question is...',
            skillTags: ['WRITING'],
            points: 4,
          },
        ],
      },
    ],
  },
];

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
      skillTags: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING', 'WRITING'],
      bio: `${seed.instructorName} phụ trách ${seed.proficiencyLevel} và các lớp luyện kỹ năng.`,
      weeklyCapacity: 12,
    },
    create: {
      tenantId,
      instructorId: instructor.id,
      subject: seed.instructorSubject,
      languageCode: seed.languageCode,
      levelRange: seed.instructorLevelRange,
      skillTags: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING', 'WRITING'],
      certifications: toInputJson([{ name: seed.proficiencyLevel, issuer: 'Demo Academic Team' }]),
      bio: `${seed.instructorName} phụ trách ${seed.proficiencyLevel} và các lớp luyện kỹ năng.`,
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
      subject: 'language',
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
      subject: 'language',
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

  const startsAt = new Date(Date.UTC(2026, 5, 8 + index, 12, 0, 0));
  const endsAt = new Date(Date.UTC(2026, 7, 8 + index, 14, 0, 0));
  const run = await prisma.courseRun.upsert({
    where: { tenantId_code: { tenantId, code: seed.runCode } },
    update: {
      title: seed.runTitle,
      courseId: course.id,
      cohortId: cohort.id,
      instructorId: instructor.id,
      status: CourseRunStatus.ENROLLING,
      capacity: 24,
      startsAt,
      endsAt,
    },
    create: {
      tenantId,
      courseId: course.id,
      cohortId: cohort.id,
      instructorId: instructor.id,
      title: seed.runTitle,
      code: seed.runCode,
      status: CourseRunStatus.ENROLLING,
      capacity: 24,
      startsAt,
      endsAt,
      timezone: 'Asia/Ho_Chi_Minh',
      deliveryMode: index % 2 === 0 ? 'online' : 'hybrid',
      onlineMeetingUrl: `https://meet.example.com/${seed.runCode.toLowerCase()}`,
    },
  });

  await prisma.runEnrollment.upsert({
    where: { runId_userId: { runId: run.id, userId: studentId } },
    update: { status: 'ENROLLED' },
    create: { tenantId, runId: run.id, userId: studentId, status: 'ENROLLED' },
  });

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
        onlineMeetingUrl: `https://meet.example.com/${seed.runCode.toLowerCase()}`,
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
        onlineMeetingUrl: `https://meet.example.com/${seed.runCode.toLowerCase()}`,
      },
    });

    await prisma.attendance.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId: studentId } },
      update: { status: sessionIndex === 0 ? AttendanceStatus.PRESENT : AttendanceStatus.EXCUSED },
      create: {
        tenantId,
        sessionId: session.id,
        userId: studentId,
        markedById: instructor.id,
        status: sessionIndex === 0 ? AttendanceStatus.PRESENT : AttendanceStatus.EXCUSED,
      },
    });
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

  const course = await prisma.course.upsert({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug: 'language-foundation-demo',
      },
    },
    update: {
      title: 'Khóa học Nền tảng Ngôn ngữ (Demo)',
      totalDuration: 30,
      isActive: true,
    },
    create: {
      title: 'Khóa học Nền tảng Ngôn ngữ (Demo)',
      slug: 'language-foundation-demo',
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
    practiceQuestion: deterministicUuid(`demo:${course.id}:practice-question:collaborate-mc`),
    practiceSet: deterministicUuid(`demo:${course.id}:practice-set:intro`),
    practiceLesson: deterministicUuid(`demo:${course.id}:lesson:practice:intro`),
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
          title: 'Bài 1: Tổng quan kỹ năng',
          type: LessonType.video,
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration: 15,
          order: 1,
          unitId: defaultUnit.id,
          tenantId: tenant.id,
          courseId: course.id,
        },
        {
          title: 'Bài 2: Từ vựng học thuật cơ bản',
          type: LessonType.text,
          content:
            '<h2>Từ vựng học thuật cơ bản</h2><p>Collaborate - làm việc cùng nhau</p><p>Concise - ngắn gọn và rõ ràng</p>',
          duration: 10,
          order: 2,
          unitId: defaultUnit.id,
          tenantId: tenant.id,
          courseId: course.id,
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

  await prisma.lesson.upsert({
    where: { id: demoIds.practiceLesson },
    update: {
      title: 'Bài 3: Bài tập ôn tập',
      type: LessonType.practice,
      duration: 5,
      order: 3,
      unitId: defaultUnit.id,
      practiceExerciseSetId: practiceSet.id,
      examId: null,
      deletedAt: null,
    },
    create: {
      id: demoIds.practiceLesson,
      title: 'Bài 3: Bài tập ôn tập',
      type: LessonType.practice,
      duration: 5,
      order: 3,
      unitId: defaultUnit.id,
      tenantId: tenant.id,
      courseId: course.id,
      practiceExerciseSetId: practiceSet.id,
    },
  });

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

  const languageProgram = await prisma.program.upsert({
    where: { id: deterministicUuid('demo:program:language-certification') },
    update: {
      title: 'Lộ trình Ngoại ngữ Chứng chỉ',
      slug: 'lo-trinh-ngoai-ngu-chung-chi',
      description: 'Các lộ trình tiếng Anh, Nhật, Trung, Hàn theo chuẩn năng lực và chứng chỉ.',
      isActive: true,
      deletedAt: null,
    },
    create: {
      id: deterministicUuid('demo:program:language-certification'),
      tenantId: tenant.id,
      title: 'Lộ trình Ngoại ngữ Chứng chỉ',
      slug: 'lo-trinh-ngoai-ngu-chung-chi',
      description: 'Các lộ trình tiếng Anh, Nhật, Trung, Hàn theo chuẩn năng lực và chứng chỉ.',
    },
  });

  for (let index = 0; index < DEMO_COURSES.length; index += 1) {
    await seedLanguageCourse({
      tenantId: tenant.id,
      studentId: student.id,
      hashedPassword,
      programId: languageProgram.id,
      seed: DEMO_COURSES[index],
      index,
    });
  }

  await seedBillingSamples(tenant.id);

  console.log(`Created/Updated Course: ${course.title}`);
  console.log(`Created/Updated ${DEMO_COURSES.length} production-like language courses`);
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
