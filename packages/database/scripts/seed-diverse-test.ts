import { PrismaClient, PracticeQuestionType, ExamQuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed diverse test data...');

  // Get the first tenant
  const tenant = await prisma.tenant.findFirst({
    where: { isActive: true },
  });

  if (!tenant) {
    console.error('No active tenant found! Please run the main seed script first.');
    process.exit(1);
  }

  // Create a new Course
  const course = await prisma.course.create({
    data: {
      tenantId: tenant.id,
      title: 'Demo Course: Các Loại Câu Hỏi Đa Dạng',
      slug: 'demo-diverse-questions-' + Date.now(),
      description: 'Khóa học này chứa các bài kiểm tra và bài luyện tập với mọi loại câu hỏi.',
      isActive: true,
    },
  });

  console.log(`Created Course: ${course.title} (ID: ${course.id})`);

  // --- 1. CREATE PRACTICE EXERCISE SET ---
  const exerciseSet = await prisma.practiceExerciseSet.create({
    data: {
      tenantId: tenant.id,
      courseId: course.id,
      title: 'Bài luyện tập tổng hợp',
      description: 'Bài luyện tập với 6 loại câu hỏi khác nhau.',
      isPublished: true,
    },
  });

  const practiceQuestions = [
    {
      tenantId: tenant.id,
      courseId: course.id,
      type: PracticeQuestionType.MULTIPLE_CHOICE,
      prompt: 'Thủ đô của nước Việt Nam là gì?',
      options: ['Hà Nội', 'Thành phố Hồ Chí Minh', 'Đà Nẵng', 'Huế'],
      correctAnswer: 'Hà Nội',
      explanation: 'Hà Nội là thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.',
    },
    {
      tenantId: tenant.id,
      courseId: course.id,
      type: PracticeQuestionType.FILL_BLANK,
      prompt: 'Trái đất quay quanh {{blank1}} và mặt trăng quay quanh {{blank2}}.',
      options: null,
      correctAnswer: { blank1: 'mặt trời', blank2: 'trái đất' },
      explanation: 'Kiến thức thiên văn cơ bản.',
    },
    {
      tenantId: tenant.id,
      courseId: course.id,
      type: PracticeQuestionType.MATCHING,
      prompt: 'Hãy nối tên quốc gia với thủ đô tương ứng.',
      options: {
        left: ['Việt Nam', 'Nhật Bản', 'Pháp', 'Hàn Quốc'],
        right: ['Tokyo', 'Hà Nội', 'Paris', 'Seoul'],
      },
      correctAnswer: {
        'Việt Nam': 'Hà Nội',
        'Nhật Bản': 'Tokyo',
        Pháp: 'Paris',
        'Hàn Quốc': 'Seoul',
      },
      explanation: 'Kiến thức địa lý.',
    },
    {
      tenantId: tenant.id,
      courseId: course.id,
      type: PracticeQuestionType.ORDERING,
      prompt: 'Hãy sắp xếp các số sau theo thứ tự tăng dần.',
      options: ['10', '1', '50', '25', '5'],
      correctAnswer: ['1', '5', '10', '25', '50'],
      explanation: 'Sắp xếp theo giá trị toán học.',
    },
    {
      tenantId: tenant.id,
      courseId: course.id,
      type: PracticeQuestionType.AI_EVALUATED_TEXT,
      prompt:
        'Viết một đoạn văn ngắn khoảng 50 từ giới thiệu về sở thích của bạn. (AI sẽ chấm điểm)',
      options: null,
      correctAnswer: { criteria: 'Ngữ pháp đúng, câu từ mạch lạc, đúng chủ đề sở thích.' },
      explanation: 'Giáo viên AI sẽ đọc và đánh giá.',
    },
    {
      tenantId: tenant.id,
      courseId: course.id,
      type: PracticeQuestionType.AI_EVALUATED_AUDIO,
      prompt:
        'Vui lòng nhấn ghi âm và đọc to câu sau: "Hello, nice to meet you. How are you doing today?"',
      options: null,
      correctAnswer: { expectedTranscript: 'Hello, nice to meet you. How are you doing today?' },
      explanation: 'Hệ thống AI sẽ đánh giá phát âm của bạn.',
    },
  ];

  let order = 0;
  for (const qData of practiceQuestions) {
    const q = await prisma.practiceQuestion.create({
      data: qData,
    });
    await prisma.practiceExerciseSetQuestion.create({
      data: {
        tenantId: tenant.id,
        exerciseSetId: exerciseSet.id,
        questionId: q.id,
        order: order++,
      },
    });
  }

  console.log(`Created Practice Exercise Set with ${practiceQuestions.length} questions.`);

  // --- 2. CREATE EXAM ---
  const exam = await prisma.exam.create({
    data: {
      tenantId: tenant.id,
      courseId: course.id,
      title: 'Đề Kiểm Tra Tổng Hợp Định Kỳ',
      description: 'Thời gian làm bài: 30 phút. Gồm nhiều dạng câu hỏi phong phú.',
      durationMinutes: 30,
      passingScore: 50,
      isPublished: true,
    },
  });

  const section1 = await prisma.examSection.create({
    data: {
      tenantId: tenant.id,
      examId: exam.id,
      title: 'Phần 1: Trắc nghiệm khách quan & Điền khuyết',
      order: 0,
    },
  });

  const section2 = await prisma.examSection.create({
    data: {
      tenantId: tenant.id,
      examId: exam.id,
      title: 'Phần 2: Nối từ, Sắp xếp & Tự luận AI',
      order: 1,
    },
  });

  const examQuestionsSection1 = [
    {
      tenantId: tenant.id,
      sectionId: section1.id,
      type: ExamQuestionType.MULTIPLE_CHOICE,
      prompt: 'Ngôn ngữ lập trình nào phổ biến nhất cho phát triển web frontend?',
      options: ['Python', 'Java', 'JavaScript', 'C++'],
      correctAnswer: 'JavaScript',
      points: 10,
      order: 0,
    },
    {
      tenantId: tenant.id,
      sectionId: section1.id,
      type: ExamQuestionType.FILL_BLANK,
      prompt:
        'Trong React, hook {{blank1}} được dùng để quản lý state, và hook {{blank2}} dùng cho side effects.',
      options: null,
      correctAnswer: { blank1: 'useState', blank2: 'useEffect' },
      points: 10,
      order: 1,
    },
  ];

  const examQuestionsSection2 = [
    {
      tenantId: tenant.id,
      sectionId: section2.id,
      type: ExamQuestionType.MATCHING,
      prompt: 'Nối framework/library với ngôn ngữ lập trình tương ứng.',
      options: {
        left: ['React', 'Django', 'Laravel', 'Spring Boot'],
        right: ['JavaScript', 'Python', 'PHP', 'Java'],
      },
      correctAnswer: {
        React: 'JavaScript',
        Django: 'Python',
        Laravel: 'PHP',
        'Spring Boot': 'Java',
      },
      points: 20,
      order: 0,
    },
    {
      tenantId: tenant.id,
      sectionId: section2.id,
      type: ExamQuestionType.ORDERING,
      prompt: 'Sắp xếp các bước phát triển phần mềm (SDLC) theo thứ tự chuẩn.',
      options: [
        'Triển khai (Deploy)',
        'Phân tích (Analyze)',
        'Thiết kế (Design)',
        'Kiểm thử (Test)',
        'Lập trình (Code)',
      ],
      correctAnswer: [
        'Phân tích (Analyze)',
        'Thiết kế (Design)',
        'Lập trình (Code)',
        'Kiểm thử (Test)',
        'Triển khai (Deploy)',
      ],
      points: 20,
      order: 1,
    },
    {
      tenantId: tenant.id,
      sectionId: section2.id,
      type: ExamQuestionType.AI_EVALUATED_TEXT,
      prompt:
        'Trình bày sự khác biệt cơ bản giữa SQL và NoSQL. AI sẽ chấm điểm dựa trên độ chính xác kỹ thuật.',
      options: null,
      correctAnswer: {
        criteria:
          'SQL là cơ sở dữ liệu quan hệ, dùng bảng. NoSQL không quan hệ, dùng tài liệu/key-value.',
      },
      points: 40,
      order: 2,
    },
  ];

  for (const q of [...examQuestionsSection1, ...examQuestionsSection2]) {
    await prisma.examQuestion.create({ data: q });
  }

  console.log(
    `Created Exam with 2 sections and ${examQuestionsSection1.length + examQuestionsSection2.length} questions.`,
  );

  console.log('Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Course ID:', course.id);
  console.log('Exam ID:', exam.id);
  console.log('Practice ID:', exerciseSet.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
