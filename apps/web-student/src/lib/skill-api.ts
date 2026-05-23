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

export type SkillMasteryTrendDay = { date: string } & Record<string, string | number>;

export interface SkillMasteryTrendSkill {
  code: string;
  name: string;
  nameVi: string | null;
  color: string | null;
}

export interface SkillMasteryTrend {
  days: number;
  skills: SkillMasteryTrendSkill[];
  trend: SkillMasteryTrendDay[];
}

export const skillApi = {
  listSkills() {
    return api.get('/skills').then((response) => response.data as Skill[]);
  },
  getMastery() {
    return api.get('/skills/mastery').then((response) => response.data as SkillMasterySnapshot[]);
  },
  getMasteryTrend(days = 30) {
    return api
      .get('/skills/mastery-trend', { params: { days } })
      .then((response) => response.data as SkillMasteryTrend);
  },
};
