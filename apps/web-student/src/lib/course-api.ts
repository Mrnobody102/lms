import api from "./api";

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "text" | "quiz";
  content?: string;
  videoUrl?: string;
  duration: number;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  lessons: Lesson[];
}

export const courseApi = {
  getCourses: async () => {
    const response = await api.get("/courses");
    return response.data.data; // Wrap in data due to ResponseInterceptor
  },

  getCourse: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data.data;
  },
};
