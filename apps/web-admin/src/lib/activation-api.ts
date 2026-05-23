import api from './api';

export interface ActivationCodeSummary {
  id: string;
  code: string;
  description: string | null;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  courseId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course: {
    title: string;
  } | null;
  _count: {
    redemptions: number;
  };
}

export const activationApi = {
  getCodes() {
    return api.get('/activation').then((response) => response.data as ActivationCodeSummary[]);
  },
};
