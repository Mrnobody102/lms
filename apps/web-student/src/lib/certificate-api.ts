import api from './api';

export interface CertificateProgress {
  course: {
    id: string;
    title: string;
  };
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  isComplete: boolean;
}

export interface CourseCertificate {
  id: string;
  certificateCode: string;
  issuedAt: string;
  revokedAt?: string | null;
  verifyUrl: string;
  imageUrl: string;
  user: {
    fullName: string;
  };
  course: {
    id: string;
    title: string;
  };
  tenant: {
    name: string;
  };
}

export interface CertificateStatus {
  eligible: boolean;
  progress: CertificateProgress;
  certificate: CourseCertificate | null;
}

export const certificateApi = {
  getCourseStatus(courseId: string) {
    return api
      .get(`/certificates/course/${courseId}`)
      .then((response) => response.data as CertificateStatus);
  },

  issueCourseCertificate(courseId: string) {
    return api
      .post(`/certificates/course/${courseId}/issue`)
      .then((response) => response.data as CertificateStatus);
  },

  verifyCertificate(code: string) {
    return api
      .get(`/certificates/verify/${code}`)
      .then((response) => response.data as CourseCertificate & { isValid: boolean });
  },
};
