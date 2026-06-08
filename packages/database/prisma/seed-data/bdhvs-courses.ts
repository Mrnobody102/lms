import {
  CourseRunStatus,
  ExamQuestionType,
  LessonType,
  PracticeQuestionType,
} from '../../src/generated/prisma/client/client.js';

export type QuestionType = PracticeQuestionType | ExamQuestionType;

export interface SampleQuestionSeed {
  key: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: unknown;
  options?: unknown;
  explanation?: string;
  skillTags: string[];
  points?: number;
}

export interface DemoLessonSeed {
  key: string;
  title: string;
  type?: LessonType;
  content?: string;
  duration?: number;
}

export interface DemoUnitSeed {
  key: string;
  title: string;
  description: string;
  lessons: DemoLessonSeed[];
}

export interface DemoCourseSeed {
  key: string;
  title: string;
  slug: string;
  description: string;
  languageCode: string;
  proficiencyLevel: string;
  courseSubject?: string;
  coverImageUrl: string;
  instructorEmail: string;
  instructorName: string;
  instructorSubject: string;
  instructorLevelRange: string;
  skillTags?: string[];
  cohortName: string;
  runTitle: string;
  runCode: string;
  runStatus?: CourseRunStatus;
  runCapacity?: number;
  runDeliveryMode?: string;
  runNotes?: string;
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

export const BDHVS_COURSES: DemoCourseSeed[] = [
  {
    key: 'bdhvs1-ai-leadership',
    title: 'BDHVS1 - AI chuyên sâu trong điều hành, quản lý',
    slug: 'bdhvs1-ai-dieu-hanh-quan-ly-2026',
    description:
      'Khóa Bình dân học vụ số dành cho lãnh đạo phòng, ban, trung tâm; tập trung vào xu hướng AI, chiến lược AI quốc gia, chính phủ số và năng lực lãnh đạo trong kỷ nguyên AI.',
    languageCode: 'vi',
    proficiencyLevel: 'BDHVS1',
    courseSubject: 'digital-literacy',
    coverImageUrl:
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
    instructorEmail: 'giangvien.bdhvs1@example.com',
    instructorName: 'Đỗ Thị Ngọc Quỳnh',
    instructorSubject: 'AI trong điều hành công vụ',
    instructorLevelRange: 'Leadership',
    skillTags: ['AI_FOUNDATION', 'AI_STRATEGY', 'DATA_DRIVEN', 'SECURITY'],
    cohortName: 'BDHVS1 Lãnh đạo Quý II/2026',
    runTitle: 'BDHVS1 - Lớp lãnh đạo Quý II/2026',
    runCode: 'BDHVS1-Q2-2026',
    runStatus: CourseRunStatus.DRAFT,
    runCapacity: 40,
    runDeliveryMode: 'offline',
    runNotes:
      'Tài liệu chỉ ghi thời gian dự kiến Quý II/2026; cập nhật ngày giờ cụ thể trước khi chuyển lớp sang SCHEDULED.',
    activationCode: 'BDHVS1-2026',
    units: [
      {
        key: 'ai-overview',
        title: 'Tổng quan AI và xu hướng công nghệ',
        description:
          'Các khái niệm cốt lõi, lịch sử phát triển và bức tranh chuyển đổi số quốc gia.',
        lessons: [
          {
            key: 'ai-core-concepts',
            title: 'Khái niệm cốt lõi về AI',
            duration: 30,
            content:
              '<h2>Mục tiêu</h2><p>Phân biệt trí tuệ nhân tạo, học máy và AI tạo sinh trong bối cảnh cơ quan nhà nước.</p><h3>Nội dung chính</h3><ul><li>AI là hệ thống hỗ trợ nhận diện mẫu, dự báo và tạo nội dung.</li><li>Machine Learning học từ dữ liệu lịch sử để đưa ra gợi ý hoặc phân loại.</li><li>Generative AI tạo văn bản, hình ảnh, bảng phân tích hoặc phương án xử lý dựa trên yêu cầu đầu vào.</li></ul><h3>Gợi ý thảo luận</h3><p>Liệt kê 3 quy trình tại đơn vị có thể dùng AI để giảm thời gian tổng hợp hoặc rà soát.</p>',
          },
          {
            key: 'ai-trends-vietnam',
            title: 'Xu hướng AI tại Việt Nam và khu vực công',
            duration: 35,
            content:
              '<h2>Mục tiêu</h2><p>Nhận diện các xu hướng AI có tác động trực tiếp đến dịch vụ công và quản trị địa phương.</p><h3>Nội dung chính</h3><ul><li>Dịch vụ công thông minh: trợ lý hỏi đáp, phân luồng hồ sơ, hỗ trợ tiếp dân.</li><li>AI chuyên ngành: y tế, giáo dục, giao thông, an sinh xã hội.</li><li>Hoàn thiện thể chế và dữ liệu: dữ liệu dùng chung, tiêu chuẩn kết nối và quản trị rủi ro.</li></ul><h3>Bài tập</h3><p>Chọn một dịch vụ công tại địa phương và mô tả điểm AI có thể hỗ trợ nhưng vẫn cần con người phê duyệt.</p>',
          },
        ],
      },
      {
        key: 'strategy-policy',
        title: 'Chiến lược AI và hàm ý chính sách',
        description: 'Bản đồ chiến lược AI quốc tế và cách chuyển hóa thành định hướng địa phương.',
        lessons: [
          {
            key: 'global-ai-strategies',
            title: 'So sánh các mô hình chiến lược AI',
            duration: 35,
            content:
              '<h2>Mục tiêu</h2><p>Hiểu các cách tiếp cận khác nhau của Trung Quốc, Mỹ, EU, Hàn Quốc và Singapore.</p><h3>Nội dung chính</h3><ul><li>Trung Quốc: đầu tư công, dữ liệu lớn và tích hợp AI vào hạ tầng quốc gia.</li><li>Mỹ: thị trường dẫn dắt, đổi mới nhanh và hệ sinh thái doanh nghiệp.</li><li>EU: quản trị rủi ro, đạo luật AI và bảo vệ quyền công dân.</li><li>Hàn Quốc, Singapore: thử nghiệm linh hoạt và dịch vụ công thông minh.</li></ul><h3>Câu hỏi kiểm tra</h3><p>Mô hình nào phù hợp nhất với một địa phương đang thiếu dữ liệu sạch? Vì sao?</p>',
          },
          {
            key: 'local-ai-roadmap',
            title: 'Từ chiến lược quốc gia đến hành động địa phương',
            duration: 35,
            content:
              '<h2>Mục tiêu</h2><p>Biết cách chuyển mục tiêu chiến lược thành danh mục việc làm được tại đơn vị.</p><h3>Khung 3 lớp</h3><ul><li>Nhận diện toàn cầu: xu hướng, rủi ro và chuẩn quản trị.</li><li>Định hình Việt Nam: ưu tiên dữ liệu, thể chế và năng lực nhân sự.</li><li>Thực thi kiến tạo: chọn bài toán nhỏ, đo kết quả, nhân rộng có kiểm soát.</li></ul><h3>Bài tập</h3><p>Viết một sáng kiến AI cấp phòng theo mẫu: vấn đề, dữ liệu cần có, người chịu trách nhiệm, chỉ số thành công.</p>',
          },
        ],
      },
      {
        key: 'ai-leadership',
        title: 'Năng lực lãnh đạo trong kỷ nguyên AI',
        description:
          'Ra quyết định dựa trên dữ liệu, quản trị đổi mới và xây dựng năng lực tổ chức.',
        lessons: [
          {
            key: 'data-driven-decision',
            title: 'Ra quyết định dựa trên dữ liệu',
            duration: 30,
            content:
              '<h2>Mục tiêu</h2><p>Chuyển từ quản trị phản ứng sang quản trị dự báo bằng dữ liệu.</p><h3>Nội dung chính</h3><ul><li>Dữ liệu là cốt lõi: cần định nghĩa dữ liệu đúng, đủ, có nguồn gốc.</li><li>Dashboard điều hành giúp nhìn xu hướng thay vì chỉ xem báo cáo cuối kỳ.</li><li>Quyết định vẫn thuộc về lãnh đạo; AI chỉ hỗ trợ phân tích và mô phỏng.</li></ul><h3>Checklist</h3><p>Trước khi ra quyết định bằng AI, kiểm tra nguồn dữ liệu, giả định phân tích, rủi ro sai lệch và trách nhiệm phê duyệt.</p>',
          },
          {
            key: 'safe-ai-governance',
            title: 'Quản trị AI an toàn và hiệu quả',
            duration: 30,
            content:
              '<h2>Mục tiêu</h2><p>Thiết lập nguyên tắc sử dụng AI có kiểm soát trong cơ quan.</p><h3>4 trách nhiệm của lãnh đạo</h3><ul><li>Kiến tạo: xác định bài toán ưu tiên và nguồn lực dữ liệu.</li><li>Thiết lập luật chơi: quy định dữ liệu nào được phép dùng.</li><li>Bảo vệ: kiểm soát rủi ro, bảo mật và trách nhiệm pháp lý.</li><li>Tiên phong: làm gương trong sử dụng AI đúng cách.</li></ul><h3>Bài tập</h3><p>Soạn 5 nguyên tắc sử dụng AI nội bộ cho đơn vị của bạn.</p>',
          },
        ],
      },
    ],
    practiceQuestions: [
      {
        key: 'leadership-human-in-loop',
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        prompt: 'Nguyên tắc phù hợp nhất khi lãnh đạo dùng AI để hỗ trợ quyết định là gì?',
        options: [
          'Giao toàn bộ quyết định cho AI',
          'Dùng AI để tham khảo và vẫn kiểm chứng dữ liệu, nguồn gốc',
          'Chỉ dùng AI với tài liệu mật',
          'Sao chép nguyên văn kết quả AI vào văn bản',
        ],
        correctAnswer: 1,
        explanation:
          'AI hỗ trợ phân tích, còn con người chịu trách nhiệm kiểm chứng và quyết định.',
        skillTags: ['AI_STRATEGY', 'SECURITY'],
      },
      {
        key: 'leadership-action-plan',
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        prompt:
          'Viết một sáng kiến AI cấp phòng theo cấu trúc: vấn đề, dữ liệu cần có, người phụ trách, chỉ số thành công.',
        correctAnswer:
          'Vấn đề: ... Dữ liệu cần có: ... Người phụ trách: ... Chỉ số thành công: ...',
        skillTags: ['DATA_DRIVEN'],
      },
    ],
    examSections: [
      {
        key: 'ai-leadership-check',
        title: 'Kiểm tra năng lực lãnh đạo AI',
        order: 0,
        questions: [
          {
            key: 'ai-risk-check',
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt:
              'Khi dữ liệu đầu vào chưa rõ nguồn gốc, lãnh đạo nên làm gì trước khi dùng kết quả AI?',
            options: [
              'Phê duyệt ngay',
              'Kiểm tra nguồn và giới hạn sử dụng dữ liệu',
              'Đưa lên AI công cộng nhiều hơn',
              'Bỏ qua rủi ro',
            ],
            correctAnswer: 1,
            skillTags: ['SECURITY'],
            points: 2,
          },
          {
            key: 'ai-policy-text',
            type: ExamQuestionType.AI_EVALUATED_TEXT,
            prompt: 'Soạn 3 nguyên tắc sử dụng AI an toàn cho cơ quan nhà nước.',
            correctAnswer:
              'Không nhập dữ liệu mật; kiểm chứng nguồn; con người chịu trách nhiệm cuối cùng.',
            skillTags: ['SECURITY', 'AI_STRATEGY'],
            points: 4,
          },
        ],
      },
    ],
  },
  {
    key: 'bdhvs2-ai-specialist',
    title: 'BDHVS2 - AI nâng cao trong hoạt động công vụ',
    slug: 'bdhvs2-ai-cong-vu-chuyen-vien-2026',
    description:
      'Khóa Bình dân học vụ số dành cho chuyên viên; tập trung vào công cụ AI phổ biến, prompt, soạn thảo văn bản, quản lý công việc, phân tích số liệu, bảo mật và thực hành tình huống công vụ.',
    languageCode: 'vi',
    proficiencyLevel: 'BDHVS2',
    courseSubject: 'digital-literacy',
    coverImageUrl:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    instructorEmail: 'giangvien.bdhvs2@example.com',
    instructorName: 'Nguyễn Linh Chi',
    instructorSubject: 'AI trong hoạt động công vụ',
    instructorLevelRange: 'Specialist',
    skillTags: ['AI_FOUNDATION', 'PROMPTING', 'DOCUMENT_AUTOMATION', 'SECURITY'],
    cohortName: 'BDHVS2 Chuyên viên Quý II/2026',
    runTitle: 'BDHVS2 - Lớp chuyên viên Quý II/2026',
    runCode: 'BDHVS2-Q2-2026',
    runStatus: CourseRunStatus.DRAFT,
    runCapacity: 50,
    runDeliveryMode: 'offline',
    runNotes:
      'Tài liệu chỉ ghi thời gian dự kiến Quý II/2026; cập nhật ngày giờ cụ thể trước khi chuyển lớp sang SCHEDULED.',
    activationCode: 'BDHVS2-2026',
    units: [
      {
        key: 'ai-tool-ecosystem',
        title: 'Hệ sinh thái AI trong hành chính công',
        description: 'Chọn đúng nhóm công cụ AI cho từng loại việc trong cơ quan.',
        lessons: [
          {
            key: 'chatbots-for-documents',
            title: 'Chatbot AI cho soạn thảo và tóm tắt văn bản',
            duration: 25,
            content:
              '<h2>Mục tiêu</h2><p>Sử dụng ChatGPT, Gemini hoặc Claude để tạo bản nháp, tóm tắt và hiệu đính văn bản hành chính.</p><h3>Quy trình</h3><ol><li>Nêu vai trò và bối cảnh công việc.</li><li>Dán phần nội dung không chứa thông tin mật hoặc định danh cá nhân.</li><li>Yêu cầu định dạng đầu ra rõ ràng: gạch đầu dòng, bảng, dự thảo công văn.</li><li>Kiểm tra lại thể thức, căn cứ pháp lý và số liệu.</li></ol><h3>Prompt mẫu</h3><p>Với vai trò chuyên viên phòng Nội vụ, hãy tóm tắt văn bản sau trong 3 gạch đầu dòng và liệt kê toàn bộ mốc thời gian cần xử lý.</p>',
          },
          {
            key: 'notebooklm-stt-ocr',
            title: 'NotebookLM, Speech-to-Text và OCR trong số hóa hồ sơ',
            duration: 25,
            content:
              '<h2>Mục tiêu</h2><p>Biết chọn công cụ phù hợp cho tra cứu tài liệu nội bộ, gỡ băng cuộc họp và số hóa hồ sơ giấy.</p><h3>Nội dung chính</h3><ul><li>NotebookLM: hỏi đáp dựa trên tài liệu đã tải lên, có trích nguồn.</li><li>Speech-to-Text: chuyển ghi âm cuộc họp thành biên bản thô.</li><li>OCR: chuyển tài liệu scan thành văn bản có thể tìm kiếm.</li></ul><h3>Lưu ý</h3><p>Không đưa tài liệu mật hoặc dữ liệu cá nhân lên nền tảng AI công cộng.</p>',
          },
        ],
      },
      {
        key: 'practical-ai-techniques',
        title: 'Kỹ thuật AI thực chiến',
        description: 'Prompt, soạn thảo, quản lý công việc và phân tích số liệu.',
        lessons: [
          {
            key: 'prompt-four-parts',
            title: 'Công thức prompt 4 bước',
            duration: 30,
            content:
              '<h2>Mục tiêu</h2><p>Viết câu lệnh rõ ràng để giảm số lần chỉnh sửa kết quả AI.</p><h3>Công thức</h3><ul><li>Vai trò: AI cần đóng vai ai?</li><li>Ngữ cảnh: hồ sơ, báo cáo, cuộc họp hay nhiệm vụ nào?</li><li>Nhiệm vụ: cần tóm tắt, soạn thảo, kiểm tra hay phân tích?</li><li>Định dạng: bảng, gạch đầu dòng, dự thảo văn bản hay checklist?</li></ul><h3>Bài tập</h3><p>Viết 3 prompt cho: tóm tắt công văn, rà soát thể thức văn bản, phân tích bảng số liệu quý.</p>',
          },
          {
            key: 'office-data-analysis',
            title: 'Tổng hợp và phân tích số liệu bằng AI',
            duration: 30,
            content:
              '<h2>Mục tiêu</h2><p>Dùng AI để đọc bảng số liệu, chỉ ra xu hướng và chuẩn bị nhận xét cho báo cáo.</p><h3>Quy trình</h3><ol><li>Làm sạch bảng: tên cột rõ, không gộp ô phức tạp.</li><li>Ẩn thông tin định danh nếu dữ liệu nhạy cảm.</li><li>Yêu cầu AI tạo nhận xét: tăng, giảm, bất thường, nguyên nhân giả định.</li><li>Kiểm chứng lại bằng công thức hoặc nguồn dữ liệu gốc.</li></ol><h3>Prompt mẫu</h3><p>Phân tích xu hướng theo quý, nêu 3 điểm nổi bật và đề xuất biểu đồ phù hợp cho báo cáo lãnh đạo.</p>',
          },
        ],
      },
      {
        key: 'secure-ai-use',
        title: 'Sử dụng AI an toàn, bảo mật và trách nhiệm',
        description: 'Nhận diện rủi ro thông tin, ảo giác AI và nguyên tắc kiểm chứng.',
        lessons: [
          {
            key: 'ai-risks',
            title: 'Rủi ro thông tin mật và ảo giác AI',
            duration: 25,
            content:
              '<h2>Mục tiêu</h2><p>Nhận biết các rủi ro thường gặp khi dùng AI trong công việc chính thức.</p><h3>Rủi ro chính</h3><ul><li>Dữ liệu nhập vào AI có thể bị lưu trữ hoặc dùng để huấn luyện.</li><li>AI có thể tạo thông tin sai nhưng trình bày thuyết phục.</li><li>Thông tin định danh, số liệu chưa công bố và tài liệu mật không được đưa lên AI công cộng.</li></ul><h3>Nguyên tắc</h3><p>Ẩn dữ liệu nhạy cảm, kiểm chứng nguồn chính thức, không sao chép nguyên văn kết quả AI vào văn bản công vụ.</p>',
          },
          {
            key: 'public-service-scenarios',
            title: 'Thực hành tình huống công vụ',
            duration: 35,
            content:
              '<h2>Mục tiêu</h2><p>Áp dụng AI vào ba tình huống: trợ lý tiếp dân, xử lý phản ánh kiến nghị và thẩm định hồ sơ.</p><h3>Bài tập</h3><ul><li>Thiết kế chatbot trả lời câu hỏi thường gặp về thủ tục hành chính.</li><li>Phân loại 100 ý kiến người dân theo nhóm: môi trường, giao thông, an ninh, y tế, giáo dục.</li><li>Đối chiếu một hồ sơ với quy định đã tải lên NotebookLM và liệt kê điểm thiếu sót.</li></ul><h3>Đầu ra</h3><p>Mỗi nhóm nộp một bảng kết quả và ghi rõ phần nào đã được con người kiểm chứng.</p>',
          },
        ],
      },
    ],
    practiceQuestions: [
      {
        key: 'prompt-components',
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        prompt: 'Bốn thành phần chính của một prompt công vụ tốt là gì?',
        options: [
          'Màu sắc, hình ảnh, âm thanh, video',
          'Vai trò, ngữ cảnh, nhiệm vụ, định dạng',
          'Tên file, mật khẩu, số CCCD, email',
          'Càng ngắn càng tốt, không cần bối cảnh',
        ],
        correctAnswer: 1,
        explanation: 'Prompt nên có vai trò, ngữ cảnh, nhiệm vụ và định dạng đầu ra.',
        skillTags: ['PROMPTING'],
      },
      {
        key: 'summarize-official-letter',
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        prompt:
          'Viết prompt yêu cầu AI tóm tắt công văn hỏa tốc trong 3 gạch đầu dòng và liệt kê mốc thời gian.',
        correctAnswer:
          'Hãy tóm tắt công văn sau trong 3 gạch đầu dòng, liệt kê tất cả mốc thời gian và yêu cầu báo cáo...',
        skillTags: ['PROMPTING', 'DOCUMENT_AUTOMATION'],
      },
    ],
    examSections: [
      {
        key: 'ai-specialist-check',
        title: 'Kiểm tra ứng dụng AI công vụ',
        order: 0,
        questions: [
          {
            key: 'sensitive-data',
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: 'Dữ liệu nào không nên đưa lên AI công cộng?',
            options: [
              'Văn bản mẫu công khai',
              'Số CCCD và thông tin cá nhân',
              'Bài tập giả lập',
              'Danh sách chủ đề chung',
            ],
            correctAnswer: 1,
            skillTags: ['SECURITY'],
            points: 2,
          },
          {
            key: 'office-prompt',
            type: ExamQuestionType.AI_EVALUATED_TEXT,
            prompt:
              'Soạn một prompt kiểm tra thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP.',
            correctAnswer:
              'Với vai trò chuyên viên văn thư, hãy kiểm tra thể thức văn bản sau theo Nghị định 30/2020/NĐ-CP...',
            skillTags: ['PROMPTING', 'DOCUMENT_AUTOMATION'],
            points: 4,
          },
        ],
      },
    ],
  },
  {
    key: 'cntt2-digital-content',
    title: 'CNTT2 - Sáng tạo nội dung số cho quản trị website',
    slug: 'cntt2-sang-tao-noi-dung-so-quan-tri-website-2026',
    description:
      'Khóa dành cho công chức quản trị website tại đơn vị; tập trung vào sáng tạo, tích hợp, quản lý nội dung số đúng quy định và tương tác trên môi trường số.',
    languageCode: 'vi',
    proficiencyLevel: 'CNTT2',
    courseSubject: 'digital-content',
    coverImageUrl:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    instructorEmail: 'giangvien.cntt2@example.com',
    instructorName: 'Trần Minh Hòa',
    instructorSubject: 'Quản trị nội dung số',
    instructorLevelRange: 'Website Admin',
    skillTags: ['DIGITAL_CONTENT', 'COPYRIGHT', 'ONLINE_COLLABORATION'],
    cohortName: 'CNTT2 Quản trị website Quý II/2026',
    runTitle: 'CNTT2 - Lớp quản trị website Quý II/2026',
    runCode: 'CNTT2-Q2-2026',
    runStatus: CourseRunStatus.DRAFT,
    runCapacity: 35,
    runDeliveryMode: 'offline',
    runNotes:
      'Tài liệu chỉ ghi thời gian dự kiến Quý II/2026; cập nhật lịch học cụ thể trước khi mở lớp.',
    activationCode: 'CNTT2-2026',
    units: [
      {
        key: 'content-creation',
        title: 'Sáng tạo nội dung số',
        description: 'Kết hợp, tái tạo và tích hợp nội dung số cho website cơ quan.',
        lessons: [
          {
            key: 'content-repurpose',
            title: 'Tái tạo nội dung từ văn bản hành chính',
            duration: 25,
            content:
              '<h2>Mục tiêu</h2><p>Biến văn bản hành chính thành tin bài website dễ đọc nhưng vẫn đúng nội dung.</p><h3>Quy trình</h3><ol><li>Xác định thông điệp chính và đối tượng đọc.</li><li>Rút gọn câu dài, đưa thông tin quan trọng lên đầu.</li><li>Thêm tiêu đề, sapo, các ý chính và liên kết nguồn.</li><li>Kiểm tra thuật ngữ, số liệu, tên cơ quan trước khi đăng.</li></ol><h3>Bài tập</h3><p>Chuyển một thông báo nội bộ thành tin ngắn 180-220 chữ cho website.</p>',
          },
          {
            key: 'copyright-license',
            title: 'Bản quyền, giấy phép và quy định đăng tải',
            duration: 25,
            content:
              '<h2>Mục tiêu</h2><p>Nhận biết rủi ro bản quyền và quy định khi dùng hình ảnh, video, tài liệu trên website.</p><h3>Checklist trước khi đăng</h3><ul><li>Nguồn ảnh, video, biểu đồ có rõ ràng không?</li><li>Nội dung có chứa dữ liệu cá nhân hoặc thông tin chưa công bố không?</li><li>Có cần trích dẫn văn bản pháp luật hoặc văn bản nguồn không?</li><li>Tệp đính kèm có đúng phiên bản được phép công khai không?</li></ul>',
          },
        ],
      },
      {
        key: 'digital-collaboration',
        title: 'Tương tác và hợp tác qua công nghệ số',
        description:
          'Chia sẻ thông tin, phối hợp xử lý và thực hiện quy tắc ứng xử trên môi trường mạng.',
        lessons: [
          {
            key: 'online-collaboration',
            title: 'Quy trình phối hợp xuất bản nội dung',
            duration: 25,
            content:
              '<h2>Mục tiêu</h2><p>Thiết lập luồng phối hợp giữa người soạn, người duyệt và người đăng tải.</p><h3>Mô hình đề xuất</h3><ul><li>Nháp: người phụ trách biên tập nội dung.</li><li>Rà soát: kiểm tra pháp lý, thể thức, dữ liệu và hình ảnh.</li><li>Duyệt: lãnh đạo hoặc đầu mối truyền thông xác nhận.</li><li>Đăng tải: quản trị website lưu lịch sử phiên bản.</li></ul>',
          },
          {
            key: 'netiquette',
            title: 'Quy tắc ứng xử trên không gian mạng',
            duration: 20,
            content:
              '<h2>Mục tiêu</h2><p>Áp dụng quy tắc ứng xử khi phản hồi, chia sẻ và xử lý thông tin trên kênh số của đơn vị.</p><h3>Nguyên tắc</h3><ul><li>Chính xác, kịp thời, có nguồn chính thức.</li><li>Không tranh luận cảm tính trên kênh công vụ.</li><li>Không chia sẻ thông tin định danh khi chưa có căn cứ pháp lý.</li><li>Lưu lại bằng chứng và chuyển cấp xử lý khi có phản ánh phức tạp.</li></ul>',
          },
        ],
      },
    ],
    practiceQuestions: [
      {
        key: 'web-content-checklist',
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        prompt: 'Trước khi đăng tin lên website cơ quan, việc nào cần thực hiện?',
        options: [
          'Bỏ qua nguồn ảnh',
          'Kiểm tra nguồn, bản quyền và dữ liệu cá nhân',
          'Đăng càng nhanh càng tốt',
          'Chỉ kiểm tra tiêu đề',
        ],
        correctAnswer: 1,
        explanation: 'Nội dung số cần được kiểm tra nguồn, quyền sử dụng và dữ liệu nhạy cảm.',
        skillTags: ['DIGITAL_CONTENT', 'COPYRIGHT'],
      },
      {
        key: 'rewrite-news',
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        prompt:
          'Viết lại một đoạn thông báo hành chính thành tin ngắn cho website, giữ đúng nội dung và giọng văn trang trọng.',
        correctAnswer:
          'Tin bài cần có tiêu đề, sapo, nội dung chính, nguồn và lời kêu gọi hành động phù hợp.',
        skillTags: ['DIGITAL_CONTENT'],
      },
    ],
    examSections: [
      {
        key: 'content-admin-check',
        title: 'Kiểm tra quản trị nội dung website',
        order: 0,
        questions: [
          {
            key: 'copyright-risk',
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: 'Rủi ro nào thường gặp khi quản trị nội dung website?',
            options: [
              'Dùng hình ảnh không rõ nguồn',
              'Viết tiêu đề rõ ràng',
              'Có người duyệt nội dung',
              'Lưu phiên bản',
            ],
            correctAnswer: 0,
            skillTags: ['COPYRIGHT'],
            points: 2,
          },
          {
            key: 'publishing-flow',
            type: ExamQuestionType.AI_EVALUATED_TEXT,
            prompt: 'Mô tả quy trình 4 bước để xuất bản một tin bài trên website cơ quan.',
            correctAnswer: 'Nháp, rà soát, duyệt, đăng tải và lưu phiên bản.',
            skillTags: ['DIGITAL_CONTENT', 'ONLINE_COLLABORATION'],
            points: 4,
          },
        ],
      },
    ],
  },
  {
    key: 'tn2-youth-digital-economy',
    title: 'TN2 - Kỹ thuật số phục vụ truyền thông và kinh doanh',
    slug: 'tn2-ky-thuat-so-truyen-thong-kinh-doanh-2026',
    description:
      'Khóa thanh niên sử dụng phương tiện kỹ thuật số phục vụ giao tiếp, truyền thông, kinh doanh trên nền tảng kinh tế số nâng cao.',
    languageCode: 'vi',
    proficiencyLevel: 'TN2',
    courseSubject: 'digital-economy',
    coverImageUrl:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    instructorEmail: 'giangvien.tn2@example.com',
    instructorName: 'Phạm Gia Bảo',
    instructorSubject: 'Kinh tế số và truyền thông số',
    instructorLevelRange: 'Youth Advanced',
    skillTags: ['DATA_LITERACY', 'DIGITAL_MARKETING', 'ECOMMERCE', 'DIGITAL_SAFETY'],
    cohortName: 'TN2 Thanh niên Quý II/2026',
    runTitle: 'TN2 - Lớp thanh niên Quý II/2026',
    runCode: 'TN2-Q2-2026',
    runStatus: CourseRunStatus.DRAFT,
    runCapacity: 60,
    runDeliveryMode: 'online',
    runNotes:
      'Tài liệu chỉ ghi thời gian dự kiến Quý II/2026; cập nhật lịch học và nền tảng trực tuyến trước khi mở lớp.',
    activationCode: 'TN2-2026',
    units: [
      {
        key: 'data-and-insight',
        title: 'Khai thác dữ liệu và thông tin nâng cao',
        description: 'Tìm kiếm, đánh giá, phân tích và quản lý dữ liệu cá nhân/doanh nghiệp.',
        lessons: [
          {
            key: 'advanced-search',
            title: 'Tìm kiếm và thu thập dữ liệu nâng cao',
            duration: 25,
            content:
              '<h2>Mục tiêu</h2><p>Tìm thông tin có kiểm chứng phục vụ truyền thông và kinh doanh số.</p><h3>Kỹ thuật</h3><ul><li>Dùng toán tử tìm kiếm nâng cao trên Google.</li><li>Khai thác dữ liệu từ mạng xã hội một cách hợp pháp.</li><li>Dùng AI để tổng hợp thông tin nhưng phải kiểm chứng nguồn.</li><li>Ghi lại nguồn, thời điểm thu thập và giới hạn sử dụng.</li></ul>',
          },
          {
            key: 'customer-insight',
            title: 'Đọc hiểu insight khách hàng từ dữ liệu hành vi',
            duration: 25,
            content:
              '<h2>Mục tiêu</h2><p>Biến dữ liệu lượt xem, tương tác và phản hồi thành nhận định hành động được.</p><h3>Nội dung chính</h3><ul><li>Phân biệt số liệu vanity và số liệu có giá trị kinh doanh.</li><li>Đọc dashboard marketing: reach, engagement, conversion.</li><li>Tìm vấn đề: nội dung chưa đúng tệp, thông điệp chưa rõ, kênh phân phối chưa phù hợp.</li></ul><h3>Bài tập</h3><p>Nhận xét 3 insight từ bảng số liệu chiến dịch giả lập.</p>',
          },
        ],
      },
      {
        key: 'digital-communication',
        title: 'Truyền thông số và sáng tạo nội dung',
        description:
          'Xây dựng thương hiệu, viết nội dung, sản xuất video ngắn và dùng AI trong truyền thông.',
        lessons: [
          {
            key: 'content-pipeline',
            title: 'Xây dựng pipeline nội dung đa nền tảng',
            duration: 30,
            content:
              '<h2>Mục tiêu</h2><p>Tạo quy trình sản xuất nội dung ổn định cho Facebook, TikTok, YouTube hoặc website bán hàng.</p><h3>Pipeline mẫu</h3><ol><li>Nghiên cứu khách hàng và pain point.</li><li>Lên ý tưởng và lịch nội dung.</li><li>Viết kịch bản ngắn, thiết kế hình ảnh hoặc quay video.</li><li>Đăng tải, đo lường và tối ưu.</li></ol><h3>Ứng dụng AI</h3><p>Dùng AI để gợi ý ý tưởng, biến một nội dung dài thành nhiều định dạng, tạo checklist SEO và caption.</p>',
          },
          {
            key: 'ai-content-safety',
            title: 'An toàn số khi sáng tạo nội dung',
            duration: 25,
            content:
              '<h2>Mục tiêu</h2><p>Giảm rủi ro lừa đảo, xâm phạm dữ liệu cá nhân và nội dung gây hiểu lầm.</p><h3>Nguyên tắc</h3><ul><li>Không công khai thông tin cá nhân của khách hàng.</li><li>Không dùng hình ảnh, nhạc, video không rõ quyền sử dụng.</li><li>Kiểm tra nội dung do AI tạo để tránh sai sự thật.</li><li>Nhận diện đường link giả mạo, tài khoản lừa đảo và giao dịch bất thường.</li></ul>',
          },
        ],
      },
      {
        key: 'digital-business',
        title: 'Ứng dụng nền tảng số trong kinh doanh',
        description: 'Gian hàng số, vận hành, thanh toán và tăng trưởng.',
        lessons: [
          {
            key: 'digital-storefront',
            title: 'Xây dựng gian hàng số và landing page',
            duration: 30,
            content:
              '<h2>Mục tiêu</h2><p>Thiết lập hiện diện bán hàng rõ ràng trên sàn thương mại điện tử, social commerce hoặc landing page.</p><h3>Nội dung chính</h3><ul><li>Mô tả sản phẩm rõ lợi ích, thông số, hình ảnh và chính sách.</li><li>Định giá dựa trên chi phí, giá trị và mặt bằng cạnh tranh.</li><li>Thiết kế phễu bán hàng: nhận biết, quan tâm, chuyển đổi, chăm sóc.</li><li>Theo dõi đơn hàng, logistics và thanh toán số.</li></ul>',
          },
          {
            key: 'growth-marketing',
            title: 'Marketing tinh gọn và tối ưu chuyển đổi',
            duration: 25,
            content:
              '<h2>Mục tiêu</h2><p>Đo lường chiến dịch nhỏ và tối ưu dựa trên dữ liệu.</p><h3>Thực hành</h3><ul><li>Xác định một pain point khách hàng.</li><li>Viết một thông điệp bán hàng rõ ràng.</li><li>Chạy thử nội dung với ngân sách nhỏ hoặc nhóm khách hàng nhỏ.</li><li>Đo tỷ lệ nhấp, tin nhắn, đơn hàng và lý do không mua.</li></ul>',
          },
        ],
      },
    ],
    practiceQuestions: [
      {
        key: 'digital-metric',
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        prompt: 'Chỉ số nào gần với mục tiêu chuyển đổi bán hàng nhất?',
        options: [
          'Số lượt thích bài viết',
          'Số đơn hàng hoặc khách để lại thông tin',
          'Màu sắc ảnh bìa',
          'Số hashtag',
        ],
        correctAnswer: 1,
        explanation:
          'Chuyển đổi gắn với hành động có giá trị như đơn hàng, đăng ký hoặc để lại thông tin.',
        skillTags: ['DIGITAL_MARKETING', 'ECOMMERCE'],
      },
      {
        key: 'content-plan',
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        prompt:
          'Lập kế hoạch 5 bài đăng cho một sản phẩm địa phương, gồm mục tiêu, ý tưởng nội dung và kênh đăng.',
        correctAnswer: 'Kế hoạch cần có mục tiêu, ý tưởng, định dạng, kênh và chỉ số đo lường.',
        skillTags: ['DIGITAL_MARKETING'],
      },
    ],
    examSections: [
      {
        key: 'youth-digital-business-check',
        title: 'Kiểm tra truyền thông và kinh doanh số',
        order: 0,
        questions: [
          {
            key: 'customer-data-safety',
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: 'Khi quản lý dữ liệu khách hàng, hành động nào là an toàn?',
            options: [
              'Công khai số điện thoại khách',
              'Phân quyền truy cập và bảo vệ dữ liệu',
              'Gửi file khách hàng lên mọi nhóm chat',
              'Bỏ qua sao lưu',
            ],
            correctAnswer: 1,
            skillTags: ['DIGITAL_SAFETY'],
            points: 2,
          },
          {
            key: 'sales-funnel',
            type: ExamQuestionType.AI_EVALUATED_TEXT,
            prompt: 'Mô tả một phễu bán hàng số đơn giản cho sản phẩm thủ công địa phương.',
            correctAnswer:
              'Nhận biết qua nội dung, quan tâm qua tin nhắn, chuyển đổi qua ưu đãi, chăm sóc sau mua.',
            skillTags: ['ECOMMERCE', 'DIGITAL_MARKETING'],
            points: 4,
          },
        ],
      },
    ],
  },
];

export const LEGACY_DEMO_COURSE_SLUGS = [
  'language-foundation-demo',
  'tieng-nhat-jlpt-n4',
  'tieng-trung-hsk4',
  'tieng-han-topik-ii',
  'advanced-english-conversation',
  'tieng-anh-giao-tiep',
  'tieng-han-so-cap',
  'tieng-nhat-n5',
  'tieng-trung-hsk1',
];
