import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Cohort {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  _count: {
    memberships: number;
  };
  createdAt: string;
}

export interface CohortMember {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role: string;
    isActive: boolean;
  };
}

export function useCohorts() {
  const queryClient = useQueryClient();

  const cohortsQuery = useQuery({
    queryKey: ['cohorts'],
    queryFn: async () => {
      const res = await api.get('/cohorts');
      return res.data as Cohort[];
    },
  });

  const createCohort = useMutation({
    mutationFn: async (data: { name: string; description?: string; isActive?: boolean }) => {
      const res = await api.post('/cohorts', data);
      return res.data as Cohort;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });

  const updateCohort = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      isActive?: boolean;
    }) => {
      const res = await api.patch(`/cohorts/${id}`, data);
      return res.data as Cohort;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });

  const deleteCohort = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cohorts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });

  return {
    cohorts: cohortsQuery.data ?? [],
    isLoading: cohortsQuery.isLoading,
    createCohort,
    updateCohort,
    deleteCohort,
  };
}

export function useCohortMembers(cohortId: string) {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['cohorts', cohortId, 'members'],
    queryFn: async () => {
      const res = await api.get(`/cohorts/${cohortId}/members`);
      return res.data as CohortMember[];
    },
    enabled: !!cohortId,
  });

  const addMembers = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await api.post(`/cohorts/${cohortId}/members`, { userIds });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts', cohortId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/cohorts/${cohortId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts', cohortId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });

  const enrollCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await api.post(`/cohorts/${cohortId}/enroll`, { courseId });
      return res.data;
    },
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    addMembers,
    removeMember,
    enrollCourse,
  };
}
