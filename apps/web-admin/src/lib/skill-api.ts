import api from './api';

export interface Skill {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameVi: string | null;
  color: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillInput {
  code: string;
  name: string;
  nameVi?: string;
  color?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateSkillInput {
  name?: string;
  nameVi?: string;
  color?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const skillApi = {
  listSkills(includeInactive = false) {
    return api
      .get('/skills', { params: { includeInactive: includeInactive ? 'true' : undefined } })
      .then((r) => r.data as Skill[]);
  },
  createSkill(data: CreateSkillInput) {
    return api.post('/skills', data).then((r) => r.data as Skill);
  },
  updateSkill(id: string, data: UpdateSkillInput) {
    return api.patch(`/skills/${id}`, data).then((r) => r.data as Skill);
  },
  deleteSkill(id: string) {
    return api.delete(`/skills/${id}`).then((r) => r.data as Skill);
  },
};
