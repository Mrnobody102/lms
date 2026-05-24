import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ProgressStatus, Role } from '@repo/database';
import { randomBytes } from 'crypto';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';

interface CertificateUser {
  id: string;
  role: Role;
}

interface CertificateView {
  id: string;
  certificateCode: string;
  issuedAt: Date;
  revokedAt: Date | null;
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

@Injectable()
export class CertificateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
    private readonly configService: ConfigService,
  ) {}

  async getCourseCertificateStatus(courseId: string, tenantId: string, user: CertificateUser) {
    const progress = await this.getCourseCompletion(courseId, tenantId, user);
    let certificate = await this.prisma.courseCertificate.findUnique({
      where: {
        tenantId_userId_courseId: {
          tenantId,
          userId: user.id,
          courseId,
        },
      },
      include: certificateInclude,
    });

    if (!certificate && progress.isComplete) {
      certificate = await this.createCertificateWithUniqueCode(courseId, tenantId, user.id);
    }

    return {
      eligible: progress.isComplete,
      progress,
      certificate: certificate ? this.toCertificateView(certificate) : null,
    };
  }

  async issueCourseCertificate(courseId: string, tenantId: string, user: CertificateUser) {
    const status = await this.getCourseCertificateStatus(courseId, tenantId, user);

    if (status.certificate) {
      return status;
    }

    if (!status.progress.isComplete) {
      throw new BadRequestException('Course must be 100% complete before issuing a certificate');
    }

    const certificate = await this.createCertificateWithUniqueCode(courseId, tenantId, user.id);

    return {
      ...status,
      eligible: true,
      certificate: this.toCertificateView(certificate),
    };
  }

  async verifyCertificate(certificateCode: string) {
    const certificate = await this.prisma.courseCertificate.findUnique({
      where: { certificateCode },
      include: certificateInclude,
    });

    if (!certificate) {
      throw new NotFoundException(`Certificate with code ${certificateCode} not found`);
    }

    const view = this.toCertificateView(certificate);
    return {
      ...view,
      isValid: certificate.revokedAt === null,
    };
  }

  async buildCertificateImage(certificateCode: string) {
    const certificate = await this.verifyCertificate(certificateCode);
    return renderCertificateSvg({
      code: certificate.certificateCode,
      learnerName: certificate.user.fullName,
      courseTitle: certificate.course.title,
      tenantName: certificate.tenant.name,
      issuedAt: certificate.issuedAt,
      verifyUrl: certificate.verifyUrl,
      isValid: certificate.isValid,
    });
  }

  private async getCourseCompletion(courseId: string, tenantId: string, user: CertificateUser) {
    const course = await this.prisma.course.findFirst({
      where: this.learningAccess.courseWhere(tenantId, user, courseId),
      select: {
        id: true,
        title: true,
        lessons: {
          where: { deletedAt: null },
          select: {
            id: true,
            progress: {
              where: {
                userId: user.id,
                tenantId,
                status: ProgressStatus.COMPLETED,
              },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found in this tenant`);
    }

    const totalLessons = course.lessons.length;
    const completedLessons = course.lessons.filter((lesson) => lesson.progress.length > 0).length;
    const completionPercentage =
      totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    return {
      course: { id: course.id, title: course.title },
      totalLessons,
      completedLessons,
      completionPercentage,
      isComplete: totalLessons > 0 && completedLessons === totalLessons,
    };
  }

  private async createCertificateWithUniqueCode(
    courseId: string,
    tenantId: string,
    userId: string,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.prisma.courseCertificate.create({
          data: {
            tenantId,
            userId,
            courseId,
            certificateCode: this.generateCertificateCode(),
          },
          include: certificateInclude,
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          const existing = await this.prisma.courseCertificate.findUnique({
            where: {
              tenantId_userId_courseId: {
                tenantId,
                userId,
                courseId,
              },
            },
            include: certificateInclude,
          });

          if (existing) {
            return existing;
          }

          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException('Unable to generate a unique certificate code');
  }

  private generateCertificateCode() {
    return `LMS-${randomBytes(4).toString('hex').toUpperCase()}-${randomBytes(2)
      .toString('hex')
      .toUpperCase()}`;
  }

  private toCertificateView(certificate: CertificateRecord): CertificateView {
    const verifyPath = `/api/certificates/verify/${certificate.certificateCode}`;
    const imagePath = `${verifyPath}/image`;

    return {
      id: certificate.id,
      certificateCode: certificate.certificateCode,
      issuedAt: certificate.issuedAt,
      revokedAt: certificate.revokedAt,
      verifyUrl: this.toPublicUrl(verifyPath),
      imageUrl: this.toPublicUrl(imagePath),
      user: {
        fullName: certificate.user.fullName,
      },
      course: {
        id: certificate.course.id,
        title: certificate.course.title,
      },
      tenant: {
        name: certificate.tenant.name,
      },
    };
  }

  private toPublicUrl(path: string) {
    const publicUrl = this.configService.get<string>('APP_PUBLIC_URL')?.replace(/\/+$/, '');
    return publicUrl ? `${publicUrl}${path}` : path;
  }
}

const certificateInclude = {
  user: {
    select: {
      fullName: true,
    },
  },
  course: {
    select: {
      id: true,
      title: true,
    },
  },
  tenant: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.CourseCertificateInclude;

type CertificateRecord = Prisma.CourseCertificateGetPayload<{
  include: typeof certificateInclude;
}>;

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function renderCertificateSvg(input: {
  code: string;
  learnerName: string;
  courseTitle: string;
  tenantName: string;
  issuedAt: Date;
  verifyUrl: string;
  isValid: boolean;
}) {
  const issuedDate = input.issuedAt.toISOString().slice(0, 10);
  const status = input.isValid ? 'Verified' : 'Revoked';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-label="Course certificate">
  <rect width="1600" height="1000" fill="#f8fafc"/>
  <rect x="72" y="72" width="1456" height="856" rx="28" fill="#ffffff" stroke="#0f766e" stroke-width="10"/>
  <rect x="110" y="110" width="1380" height="780" rx="18" fill="none" stroke="#94a3b8" stroke-width="2"/>
  <text x="800" y="220" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="800" fill="#0f172a">Certificate of Completion</text>
  <text x="800" y="292" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600" fill="#0f766e">${escapeXml(input.tenantName)}</text>
  <text x="800" y="400" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="32" fill="#475569">This certifies that</text>
  <text x="800" y="500" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="68" font-weight="900" fill="#111827">${escapeXml(input.learnerName)}</text>
  <text x="800" y="585" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" fill="#475569">completed</text>
  <text x="800" y="660" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800" fill="#0f172a">${escapeXml(input.courseTitle)}</text>
  <text x="320" y="795" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" fill="#64748b">Issued</text>
  <text x="320" y="834" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">${issuedDate}</text>
  <text x="800" y="795" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" fill="#64748b">Verify Code</text>
  <text x="800" y="834" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="#0f766e">${escapeXml(input.code)}</text>
  <text x="1280" y="795" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" fill="#64748b">Status</text>
  <text x="1280" y="834" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="${input.isValid ? '#15803d' : '#b91c1c'}">${status}</text>
  <text x="800" y="900" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" fill="#64748b">${escapeXml(input.verifyUrl)}</text>
</svg>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
