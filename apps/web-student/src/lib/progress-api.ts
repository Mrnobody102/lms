import api from "./api";

export enum ProgressStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export interface UserLessonProgress {
  id: string;
  lessonId: string;
  status: ProgressStatus;
  updatedAt: string;
}

export const progressApi = {
  updateProgress: async (lessonId: string, status: ProgressStatus) => {
    const response = await api.post<UserLessonProgress>("/progress/update", {
      lessonId,
      status,
    });
    return response.data;
  },

  getCourseProgress: async (courseId: string) => {
    const response = await api.get<UserLessonProgress[]>(
      `/progress/course/${courseId}`,
    );
    return response.data;
  },

  getLessonProgress: async (lessonId: string) => {
    const response = await api.get<UserLessonProgress>(
      `/progress/lesson/${lessonId}`,
    );
    return response.data;
  },
};
