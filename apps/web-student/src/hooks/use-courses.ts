import { useQuery } from '@tanstack/react-query';
import { courseApi, CourseListParams } from '@/lib/course-api';

export function useCourses(params?: CourseListParams, enabled = true) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => courseApi.getCourses(params),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useCourse(id: string, enabled = true) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => courseApi.getCourse(id),
    enabled: enabled && !!id,
    staleTime: 60 * 1000,
  });
}

export function useCourseActivities(id: string, enabled = true) {
  return useQuery({
    queryKey: ['course-activities', id],
    queryFn: () => courseApi.getCourseActivities(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
  });
}

export function useLesson(id: string, enabled = true) {
  return useQuery({
    queryKey: ['lesson', id],
    queryFn: () => courseApi.getLesson(id),
    enabled: enabled && !!id,
    staleTime: 60 * 1000,
  });
}
