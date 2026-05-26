import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateActivationCodeDto } from './dto/create-activation-code.dto';
import { RedeemActivationCodeDto } from './dto/redeem-activation-code.dto';
import { EnrollmentStatus } from '@repo/database';
import { MailService } from '../mail/mail.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ActivationService {
  private readonly logger = new Logger(ActivationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificationService?: NotificationService,
    @Optional() private readonly mailService?: MailService,
  ) {}

  async create(createDto: CreateActivationCodeDto, tenantId: string) {
    if (createDto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id_tenantId: { id: createDto.courseId, tenantId } },
      });
      if (!course) {
        throw new NotFoundException('Course not found');
      }
    }

    const existingCode = await this.prisma.activationCode.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: createDto.code,
        },
      },
    });

    if (existingCode) {
      throw new ConflictException('Activation code already exists');
    }

    return this.prisma.activationCode.create({
      data: {
        tenantId,
        code: createDto.code,
        description: createDto.description,
        maxUses: createDto.maxUses ?? 1,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
        courseId: createDto.courseId,
        isActive: createDto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.activationCode.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { redemptions: true },
        },
        course: {
          select: { title: true },
        },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const code = await this.prisma.activationCode.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        course: {
          select: { id: true, title: true },
        },
        redemptions: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        },
      },
    });

    if (!code) {
      throw new NotFoundException('Activation code not found');
    }

    return code;
  }

  async redeem(redeemDto: RedeemActivationCodeDto, userId: string, tenantId: string) {
    const codeStr = redeemDto.code.trim();
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Find the active code
      const activationCode = await tx.activationCode.findUnique({
        where: {
          tenantId_code: { tenantId, code: codeStr },
        },
        include: {
          course: {
            select: { id: true, title: true },
          },
        },
      });

      if (!activationCode || !activationCode.isActive || activationCode.deletedAt) {
        throw new NotFoundException('Invalid activation code');
      }

      if (activationCode.expiresAt && activationCode.expiresAt < new Date()) {
        throw new BadRequestException('Activation code has expired');
      }

      if (activationCode.usedCount >= activationCode.maxUses) {
        throw new BadRequestException('Activation code has reached its maximum usage limit');
      }

      // Check if user already redeemed this specific code
      const existingRedemption = await tx.activationRedemption.findFirst({
        where: {
          activationCodeId: activationCode.id,
          userId,
          tenantId,
        },
      });

      if (existingRedemption) {
        throw new ConflictException('You have already redeemed this code');
      }

      // Create redemption record
      const redemption = await tx.activationRedemption.create({
        data: {
          activationCodeId: activationCode.id,
          userId,
          tenantId,
        },
      });

      // Update used count
      await tx.activationCode.update({
        where: { id_tenantId: { id: activationCode.id, tenantId } },
        data: { usedCount: { increment: 1 } },
      });

      let enrollment = null;

      // Grant course access if courseId is present
      if (activationCode.courseId) {
        enrollment = await tx.courseEnrollment.upsert({
          where: {
            tenantId_userId_courseId: {
              tenantId,
              userId,
              courseId: activationCode.courseId,
            },
          },
          update: {
            status: EnrollmentStatus.ACTIVE,
            unenrolledAt: null,
          },
          create: {
            userId,
            courseId: activationCode.courseId,
            tenantId,
            status: EnrollmentStatus.ACTIVE,
          },
        });
      }

      return {
        redemption,
        enrollment,
        course: activationCode.course,
        message: 'Code redeemed successfully',
      };
    });

    if (result.course) {
      await this.notifyCourseActivatedByCode(tenantId, user, result.course);
    }

    return result;
  }

  private async notifyCourseActivatedByCode(
    tenantId: string,
    user: { id: string; email: string; fullName: string | null },
    course: { id: string; title: string },
  ) {
    try {
      await this.notificationService?.createNotification(
        tenantId,
        user.id,
        'Khóa học đã được kích hoạt',
        `Mã kích hoạt đã mở khóa khóa học "${course.title}".`,
        'SUCCESS',
        `/courses/${course.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to create activation notification for user ${user.id}`, error);
    }

    const emailTask = this.mailService?.sendCourseEnrollmentEmail({
      email: user.email,
      fullName: user.fullName,
      courseTitle: course.title,
      courseUrl: this.buildStudentCourseUrl(course.id),
      locale: 'vi',
    });
    emailTask?.catch((error: unknown) => {
      this.logger.error(`Failed to send activation email to ${user.email}`, error);
    });
  }

  private buildStudentCourseUrl(courseId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_STUDENT_URL?.replace(/\/$/, '');
    return baseUrl ? `${baseUrl}/vi/courses/${courseId}` : `/courses/${courseId}`;
  }

  async softDelete(id: string, tenantId: string) {
    const code = await this.prisma.activationCode.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!code) {
      throw new NotFoundException('Activation code not found');
    }

    return this.prisma.activationCode.update({
      where: { id_tenantId: { id: code.id, tenantId } },
      data: { deletedAt: new Date() },
    });
  }
}
