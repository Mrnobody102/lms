export type LessonType = "video" | "text" | "quiz";

export interface Lesson {
  id: string;
  title: string;
  duration: number;
  type: LessonType;
  videoUrl?: string;
  content?: string;
  courseId: string;
  order: number;
  quiz?: any;
  completed?: boolean;
}

export interface Course {
  id: string;
  title: string;
  lessons: Lesson[];
  totalDuration?: number;
}
