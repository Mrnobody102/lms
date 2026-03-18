import { Course } from "../types/lesson";

export const MOCK_COURSE: Course = {
  id: "hsk1-basic",
  title: "Tiếng Trung HSK 1: Giao tiếp cơ bản",
  totalDuration: "145",
  lessons: [
    {
      id: "1",
      title: "Chào hỏi và giới thiệu bản thân",
      duration: "15",
      type: "video",
      completed: true,
      videoUrl: "https://www.youtube.com/embed/S2nBBMbjS8w",
    },
    {
      id: "2",
      title: "Số đếm từ 1 đến 100",
      duration: "10",
      type: "video",
      completed: true,
      videoUrl: "https://www.youtube.com/embed/nZ5uV2Nn0vA",
    },
    {
      id: "3",
      title: "Gia đình và các thành viên",
      duration: "20",
      type: "video",
      completed: false,
      videoUrl: "https://www.youtube.com/embed/I6_UjWfV7L8",
    },
    {
      id: "4",
      title: "Hỏi giờ và thời gian",
      duration: "12",
      type: "video",
      completed: false,
      videoUrl: "https://www.youtube.com/embed/fA5uS6iXWz0",
    },
    {
      id: "5",
      title: "Mua sắm và mặc cả",
      duration: "25",
      type: "video",
      completed: false,
      videoUrl: "https://www.youtube.com/embed/2uV0c9oVfCw",
    },
    {
      id: "6",
      title: "Sở thích và thói quen",
      duration: "18",
      type: "text",
      completed: false,
      content:
        "Trong bài học này, chúng ta sẽ tìm hiểu về cách diễn đạt sở thích trong tiếng Trung. Sử dụng cấu trúc: 我喜欢 (Wǒ xǐhuān) + [Sở thích]. Ví dụ: 我喜欢看电影 (Wǒ xǐhuān kàn diànyǐng) - Tôi thích xem phim.",
    },
    {
      id: "7",
      title: "Kiểm tra cuối khóa",
      duration: "45",
      type: "quiz",
      completed: false,
      quiz: {
        questions: [
          {
            question: "Từ nào sau đây nghĩa là 'Xin chào'?",
            options: ["你好", "谢谢", "再见", "对不起"],
            correctAnswer: 0,
          },
          {
            question: "'Wǒ xǐhuān' nghĩa là gì?",
            options: ["Tôi là", "Tôi thích", "Tôi ghét", "Tôi đi"],
            correctAnswer: 1,
          },
        ],
      },
    },
  ],
};
