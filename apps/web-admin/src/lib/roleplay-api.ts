import api from './api';

export type RoleplayMode = 'TEXT' | 'AUDIO' | 'MIXED';

export interface RoleplayScenario {
  id: string;
  courseId: string;
  unitId?: string | null;
  title: string;
  description?: string | null;
  targetLanguage: string;
  level?: string | null;
  skillTags: string[];
  mode: RoleplayMode;
  systemPrompt: string;
  openingMessage?: string | null;
  rubric?: unknown;
  isPublished: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  course?: { id: string; title: string };
  unit?: { id: string; title: string } | null;
  _count?: { sessions: number };
}

export interface PaginatedRoleplayScenarios {
  data: RoleplayScenario[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoleplayScenarioPayload {
  courseId: string;
  unitId?: string;
  title: string;
  description?: string;
  targetLanguage?: string;
  level?: string;
  skillTags?: string[];
  mode?: RoleplayMode;
  systemPrompt: string;
  openingMessage?: string;
  rubric?: Record<string, unknown>;
  isPublished?: boolean;
}

export const roleplayApi = {
  getScenarios(params?: {
    courseId?: string;
    unitId?: string;
    mode?: RoleplayMode;
    isPublished?: boolean;
    page?: number;
    limit?: number;
  }) {
    return api
      .get('/roleplay/scenarios', { params })
      .then((r) => r.data as PaginatedRoleplayScenarios);
  },

  createScenario(data: RoleplayScenarioPayload) {
    return api.post('/roleplay/scenarios', data).then((r) => r.data as RoleplayScenario);
  },

  updateScenario(id: string, data: Partial<RoleplayScenarioPayload>) {
    return api.patch(`/roleplay/scenarios/${id}`, data).then((r) => r.data as RoleplayScenario);
  },

  deleteScenario(id: string) {
    return api.delete(`/roleplay/scenarios/${id}`).then((r) => r.data as RoleplayScenario);
  },

  publishScenario(id: string) {
    return api.post(`/roleplay/scenarios/${id}/publish`).then((r) => r.data as RoleplayScenario);
  },

  unpublishScenario(id: string) {
    return api.post(`/roleplay/scenarios/${id}/unpublish`).then((r) => r.data as RoleplayScenario);
  },
};
