import api from "./api";
import { AxiosResponse } from "axios";

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "text" | "quiz";
  content?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  courseId: string;
}

export interface Course {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface PaginatedCourses {
  data: Course[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface PaginatedLessons {
  data: Lesson[];
  meta?: Record<string, unknown>;
}

export const courseApi = {
  getCourses(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedCourses> {
    return api.get("/courses", { params }).then((r: AxiosResponse<PaginatedCourses>) => r.data);
  },

  getCourse(id: string): Promise<Course> {
    return api.get<Course>(`/courses/${id}`).then((r: AxiosResponse<Course>) => r.data);
  },

  createCourse(data: { title: string }): Promise<Course> {
    return api.post<Course>("/courses", data).then((r: AxiosResponse<Course>) => r.data);
  },

  updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    return api.patch<Course>(`/courses/${id}`, data).then((r: AxiosResponse<Course>) => r.data);
  },

  deleteCourse(id: string): Promise<void> {
    return api.delete(`/courses/${id}`).then((r: AxiosResponse<void>) => r.data);
  },

  createLesson(courseId: string, data: Partial<Lesson>): Promise<Lesson> {
    return api.post<Lesson>(`/lessons`, { ...data, courseId }).then((r: AxiosResponse<Lesson>) => r.data);
  },

  updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson> {
    return api.patch<Lesson>(`/lessons/${id}`, data).then((r: AxiosResponse<Lesson>) => r.data);
  },

  deleteLesson(id: string): Promise<void> {
    return api.delete(`/lessons/${id}`).then((r: AxiosResponse<void>) => r.data);
  },

  getLessons(courseId: string, params?: { page?: number; limit?: number }): Promise<PaginatedLessons> {
    return api.get(`/lessons/course/${courseId}`, { params }).then((r: AxiosResponse<PaginatedLessons>) => r.data);
  },
};
