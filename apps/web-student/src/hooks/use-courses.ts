import { useQuery } from "@tanstack/react-query";
import { courseApi } from "@/lib/course-api";

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: () => courseApi.getCourses(),
    staleTime: 60 * 1000,
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: () => courseApi.getCourse(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useLesson(id: string) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: () => courseApi.getLesson(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
