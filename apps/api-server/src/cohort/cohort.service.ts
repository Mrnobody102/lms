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

    // Get valid users in a single query
    const validUsers = await this.prisma.user.findMany({
      where: {
        tenantId,
        id: { in: userIds },
        deletedAt: null,
      },
      select: { id: true },
    });

    const validUserIds = validUsers.map((u) => u.id);

    if (validUserIds.length === 0) {
      return { addedCount: 0 };
    }

    // Get existing memberships to skip them
    const existingMemberships = await this.prisma.cohortMembership.findMany({
      where: {
        cohortId: id,
        userId: { in: validUserIds },
      },
      select: { userId: true },
    });

    const existingUserIds = new Set(existingMemberships.map((m) => m.userId));
    const userIdsToAdd = validUserIds.filter((userId) => !existingUserIds.has(userId));

    if (userIdsToAdd.length === 0) {
      return { addedCount: 0 };
    }

    const { count } = await this.prisma.cohortMembership.createMany({
      data: userIdsToAdd.map((userId) => ({
        tenantId,
        cohortId: id,
        userId,
      })),
      skipDuplicates: true,
    });

    return { addedCount: count };
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

      const existingEnrollments = await tx.courseEnrollment.findMany({
        where: {
          userId: { in: userIds },
          courseId,
        },
      });

      const existingMap = new Map(existingEnrollments.map((e) => [e.userId, e]));
      const toCreate: { tenantId: string; userId: string; courseId: string; status: 'ACTIVE' }[] =
        [];
      const toUpdate: string[] = [];

      for (const userId of userIds) {
        const existing = existingMap.get(userId);
        if (!existing) {
          toCreate.push({ tenantId, userId, courseId, status: 'ACTIVE' });
        } else if (existing.status !== 'ACTIVE') {
          toUpdate.push(userId);
        } else {
          skippedCount++;
        }
      }

      if (toCreate.length > 0) {
        await tx.courseEnrollment.createMany({
          data: toCreate,
        });
        enrolledCount += toCreate.length;
      }

      if (toUpdate.length > 0) {
        await tx.courseEnrollment.updateMany({
          where: {
            userId: { in: toUpdate },
            courseId,
          },
          data: { status: 'ACTIVE', unenrolledAt: null },
        });
        enrolledCount += toUpdate.length;
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
