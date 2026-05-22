import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { Prisma, CohortMembership, User } from '@repo/database';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';

@Injectable()
export class CohortService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createCohortDto: CreateCohortDto) {
    const existing = await this.prisma.cohort.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: createCohortDto.name,
        },
      },
    });

    if (existing) {
      if (existing.deletedAt) {
        throw new ConflictException(
          'A deleted cohort with this name already exists. Please restore it or choose a different name.',
        );
      }
      throw new ConflictException('A cohort with this name already exists.');
    }

    return this.prisma.cohort.create({
      data: {
        tenantId,
        ...createCohortDto,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.cohort.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id_tenantId: { id, tenantId } },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    });

    if (!cohort || cohort.deletedAt) {
      throw new NotFoundException(`Cohort #${id} not found`);
    }

    return cohort;
  }

  async update(tenantId: string, id: string, updateCohortDto: UpdateCohortDto) {
    await this.findOne(tenantId, id);

    if (updateCohortDto.name) {
      const existing = await this.prisma.cohort.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: updateCohortDto.name,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('A cohort with this name already exists.');
      }
    }

    return this.prisma.cohort.update({
      where: { id_tenantId: { id, tenantId } },
      data: updateCohortDto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.cohort.update({
      where: { id_tenantId: { id, tenantId } },
      data: { deletedAt: new Date() },
    });
  }

  async getMembers(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    const memberships = await this.prisma.cohortMembership.findMany({
      where: { tenantId, cohortId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map(
      (
        m: CohortMembership & {
          user: Pick<User, 'id' | 'email' | 'fullName' | 'avatarUrl' | 'role' | 'isActive'>;
        },
      ) => ({
        id: m.id,
        joinedAt: m.createdAt,
        user: m.user,
      }),
    );
  }

  async addMembers(tenantId: string, id: string, userIds: string[]) {
    await this.findOne(tenantId, id);

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let addedCount = 0;
      for (const userId of userIds) {
        // verify user exists and belongs to tenant
        const user = await tx.user.findUnique({
          where: { id_tenantId: { id: userId, tenantId } },
        });

        if (!user || user.deletedAt) {
          continue; // skip invalid users
        }

        const existingMembership = await tx.cohortMembership.findUnique({
          where: { cohortId_userId: { cohortId: id, userId } },
        });

        if (!existingMembership) {
          await tx.cohortMembership.create({
            data: {
              tenantId,
              cohortId: id,
              userId,
            },
          });
          addedCount++;
        }
      }
      return { addedCount };
    });

    return result;
  }

  async removeMember(tenantId: string, cohortId: string, userId: string) {
    await this.findOne(tenantId, cohortId);

    const membership = await this.prisma.cohortMembership.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
    });

    if (!membership || membership.tenantId !== tenantId) {
      throw new NotFoundException(`User #${userId} is not a member of cohort #${cohortId}`);
    }

    await this.prisma.cohortMembership.delete({
      where: { cohortId_userId: { cohortId, userId } },
    });

    return { success: true };
  }

  async enrollIntoCourse(
    tenantId: string,
    cohortId: string,
    courseId: string,
    adminUserId: string,
  ) {
    await this.findOne(tenantId, cohortId);

    const course = await this.prisma.course.findUnique({
      where: { id_tenantId: { id: courseId, tenantId } },
    });

    if (!course || course.deletedAt) {
      throw new NotFoundException(`Course #${courseId} not found`);
    }

    const memberships = await this.prisma.cohortMembership.findMany({
      where: { tenantId, cohortId },
      select: { userId: true },
    });

    const userIds = memberships.map((m: { userId: string }) => m.userId);

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let enrolledCount = 0;
      let skippedCount = 0;

      for (const userId of userIds) {
        const existingEnrollment = await tx.courseEnrollment.findUnique({
          where: { userId_courseId: { userId, courseId } },
        });

        if (!existingEnrollment) {
          await tx.courseEnrollment.create({
            data: {
              tenantId,
              userId,
              courseId,
              status: 'ACTIVE',
            },
          });
          enrolledCount++;
        } else if (existingEnrollment.status !== 'ACTIVE') {
          await tx.courseEnrollment.update({
            where: { userId_courseId: { userId, courseId } },
            data: { status: 'ACTIVE', unenrolledAt: null },
          });
          enrolledCount++;
        } else {
          skippedCount++;
        }
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: adminUserId,
          action: 'BULK_ENROLL_COHORT',
          status: 'SUCCESS',
          metadata: { cohortId, courseId, enrolledCount, skippedCount, userIds },
        },
      });

      return { enrolledCount, skippedCount };
    });

    return result;
  }
}
