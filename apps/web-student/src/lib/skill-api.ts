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
}

export interface SkillMasterySnapshot {
  id: string;
  tenantId: string;
  userId: string;
  skillCode: string;
  mastery: number;
  attempts: number;
  correctAttempts: number;
  lastUpdatedAt: string;
  skill: Pick<
    Skill,
    'id' | 'code' | 'name' | 'nameVi' | 'color' | 'description' | 'isActive'
  > | null;
}

export const skillApi = {
  listSkills() {
    return api.get('/skills').then((response) => response.data as Skill[]);
  },
  getMastery() {
    return api.get('/skills/mastery').then((response) => response.data as SkillMasterySnapshot[]);
  },
};
