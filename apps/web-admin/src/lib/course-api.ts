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
    const response = await api.get<Course[]>("/courses");
    return response.data;
  },

  getCourse: async (id: string) => {
    const response = await api.get<Course>(`/courses/${id}`);
    return response.data;
  },

  createCourse: async (data: { title: string }) => {
    const response = await api.post<Course>("/courses", data);
    return response.data;
  },

  updateCourse: async (id: string, data: Partial<Course>) => {
    const response = await api.patch<Course>(`/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id: string) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  // Lesson actions
  createLesson: async (courseId: string, data: Partial<Lesson>) => {
    const response = await api.post<Lesson>(`/lessons`, { ...data, courseId });
    return response.data;
  },

  updateLesson: async (id: string, data: Partial<Lesson>) => {
    const response = await api.patch<Lesson>(`/lessons/${id}`, data);
    return response.data;
  },

  deleteLesson: async (id: string) => {
    const response = await api.delete(`/lessons/${id}`);
    return response.data;
  },
};
