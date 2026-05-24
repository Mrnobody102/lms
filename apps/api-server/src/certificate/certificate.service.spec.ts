import { BadRequestException } from '@nestjs/common';
import { Role } from '@repo/database';
import { describe, expect, it, vi } from 'vitest';
import { CertificateService } from './certificate.service';

describe('CertificateService', () => {
  const issuedAt = new Date('2026-05-23T00:00:00.000Z');

  const createCertificateRecord = () => ({
    id: 'certificate-1',
    certificateCode: 'LMS-ABCD1234-EF12',
    issuedAt,
    revokedAt: null,
    user: { fullName: 'Student One' },
    course: { id: 'course-1', title: 'HSK 1' },
    tenant: { name: 'Demo Center' },
  });

  const createService = (lessons: Array<{ id: string; progress: { id: string }[] }>) => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'course-1',
          title: 'HSK 1',
          lessons,
        }),
      },
      courseCertificate: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createCertificateRecord()),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ id: 'course-1', tenantId: 'tenant-1' }),
    };
    const configService = {
      get: vi.fn().mockReturnValue(undefined),
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
});
