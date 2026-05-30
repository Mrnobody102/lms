import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Optional,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { Prisma, CohortMembership, User } from '@repo/database';
import { AuditAction, AuditLogService, AuditStatus } from '../common/services/audit-log.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { MailService } from '../mail/mail.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CohortService {
  private readonly logger = new Logger(CohortService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    @Optional() private readonly notificationService?: NotificationService,
    @Optional() private readonly mailService?: MailService,
  ) {}

  async create(tenantId: string, createCohortDto: CreateCohortDto, actorId?: string) {
    await this.validateInstructorAssignment(tenantId, createCohortDto.instructorId);

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

    const cohort = await this.prisma.cohort.create({
      data: {
        tenantId,
        ...createCohortDto,
      },
    });

    await this.auditLog.log({
      userId: actorId,
      tenantId,
      action: AuditAction.COHORT_CREATE,
      status: AuditStatus.SUCCESS,
      metadata: { cohortId: cohort.id, name: cohort.name },
    });

    return cohort;
  }

  async findAll(tenantId: string) {
    return this.prisma.cohort.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        _count: {
          select: { memberships: true },
        },
        instructor: {
          select: { id: true, fullName: true, email: true },
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
        instructor: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!cohort || cohort.deletedAt) {
      throw new NotFoundException(`Cohort #${id} not found`);
    }

    return cohort;
  }

  async update(tenantId: string, id: string, updateCohortDto: UpdateCohortDto, actorId?: string) {
    await this.findOne(tenantId, id);
    if (Object.prototype.hasOwnProperty.call(updateCohortDto, 'instructorId')) {
      await this.validateInstructorAssignment(tenantId, updateCohortDto.instructorId ?? undefined);
    }

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

    const cohort = await this.prisma.cohort.update({
      where: { id_tenantId: { id, tenantId } },
      data: updateCohortDto,
    });

    await this.auditLog.log({
      userId: actorId,
      tenantId,
      action: AuditAction.COHORT_UPDATE,
      status: AuditStatus.SUCCESS,
      metadata: { cohortId: id, changedFields: Object.keys(updateCohortDto) },
    });

    return cohort;
  }

  async remove(tenantId: string, id: string, actorId?: string) {
    await this.findOne(tenantId, id);

    const cohort = await this.prisma.cohort.update({
      where: { id_tenantId: { id, tenantId } },
      data: { deletedAt: new Date() },
    });

    await this.auditLog.log({
      userId: actorId,
      tenantId,
      action: AuditAction.COHORT_DELETE,
      status: AuditStatus.SUCCESS,
      metadata: { cohortId: id },
    });

    return cohort;
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

  async addMembers(tenantId: string, id: string, userIds: string[], actorId?: string) {
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
      const invalidCount = userIds.length;
      await this.auditLog.log({
        userId: actorId,
        tenantId,
        action: AuditAction.COHORT_MEMBERS_ADD,
        status: AuditStatus.SUCCESS,
        metadata: { cohortId: id, requestedCount: userIds.length, addedCount: 0, invalidCount },
      });
      return { addedCount: 0, skippedCount: 0, invalidCount };
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
      const skippedCount = validUserIds.length;
      const invalidCount = userIds.length - validUserIds.length;
      await this.auditLog.log({
        userId: actorId,
        tenantId,
        action: AuditAction.COHORT_MEMBERS_ADD,
        status: AuditStatus.SUCCESS,
        metadata: {
          cohortId: id,
          requestedCount: userIds.length,
          addedCount: 0,
          skippedCount,
          invalidCount,
        },
      });
      return { addedCount: 0, skippedCount, invalidCount };
    }

    const { count } = await this.prisma.cohortMembership.createMany({
      data: userIdsToAdd.map((userId) => ({
        tenantId,
        cohortId: id,
        userId,
      })),
      skipDuplicates: true,
    });

    const skippedCount = validUserIds.length - count;
    const invalidCount = userIds.length - validUserIds.length;

    await this.auditLog.log({
      userId: actorId,
      tenantId,
      action: AuditAction.COHORT_MEMBERS_ADD,
      status: AuditStatus.SUCCESS,
      metadata: {
        cohortId: id,
        requestedCount: userIds.length,
        validCount: validUserIds.length,
        addedCount: count,
        skippedCount,
        invalidCount,
      },
    });

    return { addedCount: count, skippedCount, invalidCount };
  }

  async removeMember(tenantId: string, cohortId: string, userId: string, actorId?: string) {
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

    await this.auditLog.log({
      userId: actorId,
      tenantId,
      action: AuditAction.COHORT_MEMBER_REMOVE,
      status: AuditStatus.SUCCESS,
      metadata: { cohortId, targetUserId: userId },
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
          tenantId,
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
            tenantId,
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
          action: AuditAction.COHORT_BULK_ENROLL,
          status: 'SUCCESS',
          metadata: { cohortId, courseId, enrolledCount, skippedCount, userIds },
        },
      });

      return {
        enrolledCount,
        skippedCount,
        enrolledUserIds: [...toCreate.map((e) => e.userId), ...toUpdate],
      };
    });

    if (result.enrolledUserIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: {
          tenantId,
          id: { in: result.enrolledUserIds },
          deletedAt: null,
        },
        select: { id: true, email: true, fullName: true },
      });

      await Promise.all(
        users.map(async (user) => {
          try {
            await this.notificationService?.createNotification(
              tenantId,
              user.id,
              'Khóa học đã được kích hoạt',
              `Bạn đã được ghi danh vào khóa học "${course.title}".`,
              'SUCCESS',
              `/courses/${course.id}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to create cohort enrollment notification for user ${user.id}`,
              error,
            );
          }

          const emailTask = this.mailService?.sendCourseEnrollmentEmail({
            email: user.email,
            fullName: user.fullName,
            courseTitle: course.title,
            courseUrl: this.buildStudentCourseUrl(course.id),
            locale: 'vi',
          });
          emailTask?.catch((error: unknown) => {
            this.logger.error(`Failed to send cohort enrollment email to ${user.email}`, error);
          });
        }),
      );
    }

    return { enrolledCount: result.enrolledCount, skippedCount: result.skippedCount };
  }

  private async validateInstructorAssignment(tenantId: string, instructorId?: string) {
    if (!instructorId) {
      return;
    }

    const instructor = await this.prisma.user.findUnique({
      where: { id_tenantId: { id: instructorId, tenantId } },
      select: { id: true, role: true, deletedAt: true, isActive: true },
    });

    if (!instructor || instructor.deletedAt || !instructor.isActive) {
      throw new BadRequestException('Assigned instructor is invalid or inactive.');
    }

    if (instructor.role !== 'INSTRUCTOR') {
      throw new BadRequestException('Assigned user must have instructor role.');
    }
  }

  private buildStudentCourseUrl(courseId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_STUDENT_URL?.replace(/\/$/, '');
    return baseUrl ? `${baseUrl}/vi/courses/${courseId}` : `/courses/${courseId}`;
  }
}
