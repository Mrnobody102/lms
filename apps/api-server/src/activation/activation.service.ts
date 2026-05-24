import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateActivationCodeDto } from './dto/create-activation-code.dto';
import { RedeemActivationCodeDto } from './dto/redeem-activation-code.dto';
import { EnrollmentStatus } from '@repo/database';

@Injectable()
export class ActivationService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
      // Find the active code
      const activationCode = await tx.activationCode.findUnique({
        where: {
          tenantId_code: { tenantId, code: codeStr },
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
        message: 'Code redeemed successfully',
      };
    });
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
