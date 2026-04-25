import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi, Course, Lesson } from '@/lib/course-api';

export function useCourses(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => courseApi.getCourses(params),
    staleTime: 60 * 1000,
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => courseApi.getCourse(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useLessons(courseId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['lessons', courseId, params],
    queryFn: () => courseApi.getLessons(courseId, params),
    enabled: !!courseId,
    staleTime: 60 * 1000,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; slug?: string; totalDuration?: number }) =>
      courseApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Course> }) =>
      courseApi.updateCourse(id, data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['course', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, userId }: { courseId: string; userId: string }) =>
      courseApi.enrollStudent(courseId, userId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['course', vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useUnenrollStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, userId }: { courseId: string; userId: string }) =>
      courseApi.unenrollStudent(courseId, userId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['course', vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: Partial<Lesson> }) =>
      courseApi.createLesson(courseId, data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lessons', vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', vars.courseId] });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      courseId: _courseId,
    }: {
      id: string;
      data: Partial<Lesson>;
      courseId: string;
    }) => courseApi.updateLesson(id, data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['course', vars.courseId] });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, courseId }: { id: string; courseId: string }) => courseApi.deleteLesson(id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lessons', vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', vars.courseId] });
    },
  });
}
