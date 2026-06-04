import { BadRequestException } from '@nestjs/common';
import { Role } from '@repo/database';
import { describe, expect, it, vi } from 'vitest';
import { CertificateService } from './certificate.service';

describe('CertificateService', () => {
  const issuedAt = new Date('2026-05-23T00:00:00.000Z');

  const createBaseCertificateRecord = () => ({
    id: 'certificate-1',
    certificateCode: 'LMS-ABCD1234-EF12',
    issuedAt,
    revokedAt: null,
    user: { fullName: 'Student One' },
    course: { id: 'course-1', title: 'IELTS Foundations' },
    tenant: { name: 'Demo Center' },
  });

  const createCertificateRecord = (
    overrides: Partial<ReturnType<typeof createBaseCertificateRecord>> = {},
  ) => ({
    ...createBaseCertificateRecord(),
    ...overrides,
  });

  const createService = (
    lessons: Array<{ id: string; progress: { id: string }[] }>,
    options: {
      certificateRecord?: ReturnType<typeof createBaseCertificateRecord>;
      config?: Record<string, string | undefined>;
    } = {},
  ) => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'course-1',
          title: 'IELTS Foundations',
          lessons,
        }),
      },
      courseCertificate: {
        findUnique: vi.fn().mockResolvedValue(options.certificateRecord ?? null),
        create: vi.fn().mockResolvedValue(options.certificateRecord ?? createCertificateRecord()),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ id: 'course-1', tenantId: 'tenant-1' }),
    };
    const configService = {
      get: vi.fn((key: string) => options.config?.[key]),
    };

    return {
      prisma,
      service: new CertificateService(
        prisma as never,
        learningAccess as never,
        configService as never,
      ),
    };
  };

  it('does not issue a certificate when progress is incomplete', async () => {
    const { prisma, service } = createService([
      { id: 'lesson-1', progress: [{ id: 'progress-1' }] },
      { id: 'lesson-2', progress: [] },
    ]);

    const status = await service.getCourseCertificateStatus('course-1', 'tenant-1', {
      id: 'student-1',
      role: Role.STUDENT,
    });

    expect(status.eligible).toBe(false);
    expect(status.certificate).toBeNull();
    expect(prisma.courseCertificate.create).not.toHaveBeenCalled();
  });

  it('auto-issues an idempotent certificate when progress is complete', async () => {
    const { prisma, service } = createService([
      { id: 'lesson-1', progress: [{ id: 'progress-1' }] },
      { id: 'lesson-2', progress: [{ id: 'progress-2' }] },
    ]);

    const status = await service.getCourseCertificateStatus('course-1', 'tenant-1', {
      id: 'student-1',
      role: Role.STUDENT,
    });

    expect(status.eligible).toBe(true);
    expect(status.certificate?.certificateCode).toBe('LMS-ABCD1234-EF12');
    expect(status.certificate?.verifyUrl).toBe('/vi/certificates/LMS-ABCD1234-EF12');
    expect(status.certificate?.imageUrl).toBe(
      '/api/certificates/verify/LMS-ABCD1234-EF12/image',
    );
    expect(prisma.courseCertificate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'student-1',
          courseId: 'course-1',
          certificateCode: expect.stringMatching(/^LMS-[A-F0-9]{8}-[A-F0-9]{4}$/),
        }),
      }),
    );
  });

  it('rejects explicit issuing when the course is not complete', async () => {
    const { service } = createService([{ id: 'lesson-1', progress: [] }]);

    await expect(
      service.issueCourseCertificate('course-1', 'tenant-1', {
        id: 'student-1',
        role: Role.STUDENT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses the student portal as the public verification URL', async () => {
    const certificateRecord = createCertificateRecord();
    const { service } = createService([], {
      certificateRecord,
      config: {
        APP_PUBLIC_URL: 'https://api.example.com',
        NEXT_PUBLIC_WEB_STUDENT_URL: 'https://student.example.com',
      },
    });

    const certificate = await service.verifyCertificate(certificateRecord.certificateCode);

    expect(certificate.verifyUrl).toBe(
      'https://student.example.com/vi/certificates/LMS-ABCD1234-EF12',
    );
    expect(certificate.imageUrl).toBe(
      'https://api.example.com/api/certificates/verify/LMS-ABCD1234-EF12/image',
    );
  });

  it('renders Vietnamese certificate text without exposing the API verify endpoint in the image', async () => {
    const certificateRecord = createCertificateRecord({
      user: { fullName: 'Phạm Quang Huy' },
      course: { id: 'course-1', title: 'Tiếng Hàn TOPIK II' },
      tenant: { name: 'Trung tâm Tiếng Việt' },
    });
    const { service } = createService([], {
      certificateRecord,
      config: {
        APP_PUBLIC_URL: 'https://api.example.com',
        NEXT_PUBLIC_WEB_STUDENT_URL: 'https://student.example.com',
      },
    });

    const svg = await service.buildCertificateImage(certificateRecord.certificateCode);

    expect(svg).toContain('Phạm Quang Huy');
    expect(svg).toContain('Tiếng Hàn TOPIK II');
    expect(svg).toContain('Trung tâm Tiếng Việt');
    expect(svg).toContain('https://student.example.com/vi/certificates/LMS-ABCD1234-EF12');
    expect(svg).not.toContain('https://api.example.com/api/certificates/verify');
  });
});
