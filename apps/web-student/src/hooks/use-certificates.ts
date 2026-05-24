import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { certificateApi } from '@/lib/certificate-api';

export function useCourseCertificateStatus(courseId: string) {
  return useQuery({
    queryKey: ['certificate-status', courseId],
    queryFn: () => certificateApi.getCourseStatus(courseId),
    enabled: Boolean(courseId),
    staleTime: 30 * 1000,
  });
}

export function useIssueCourseCertificate(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => certificateApi.issueCourseCertificate(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-status', courseId] });
      queryClient.invalidateQueries({ queryKey: ['progress-summary'] });
    },
  });
}

export function useCertificateVerification(code: string) {
  return useQuery({
    queryKey: ['certificate-verification', code],
    queryFn: () => certificateApi.verifyCertificate(code),
    enabled: Boolean(code),
    staleTime: 5 * 60 * 1000,
  });
}
