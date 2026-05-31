import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseRunStatus, Prisma, Role, RunEnrollmentStatus } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { AddRunEnrollmentsDto } from './dto/add-run-enrollments.dto';
import { CreateCourseRunDto } from './dto/create-course-run.dto';
import { CreateRunSessionDto } from './dto/create-run-session.dto';
import { UpdateCourseRunDto } from './dto/update-course-run.dto';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';

interface CourseRunUser {
  id: string;
  role: Role;
}

@Injectable()
export class CourseRunService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
  ) {}

  async list(tenantId: string, user: CourseRunUser) {
    return this.prisma.courseRun.findMany({
      where: this.runWhereForUser(tenantId, user),
      include: this.runInclude(),
      orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async get(tenantId: string, id: string, user: CourseRunUser) {
    const run = await this.prisma.courseRun.findFirst({
      where: { ...this.runWhereForUser(tenantId, user), id },
      include: this.runInclude(),
    });

    if (!run) {
      throw new NotFoundException('Course run not found');
    }

    return run;
  }

  async create(tenantId: string, dto: CreateCourseRunDto) {
    await this.ensureCourse(tenantId, dto.courseId);
    await this.ensureInstructor(tenantId, dto.instructorId);
    await this.ensureOptionalCohort(tenantId, dto.cohortId);
    this.validateWindow(dto.startsAt, dto.endsAt, 'Run end time must be after start time');
    this.validateWindow(
      dto.enrollmentOpensAt,
      dto.enrollmentClosesAt,
      'Enrollment close time must be after open time',
    );

    if (dto.startsAt && dto.endsAt) {
      await this.ensureInstructorHasNoConflict(
        tenantId,
        dto.instructorId,
        dto.startsAt,
        dto.endsAt,
      );
    }

    return this.prisma.courseRun.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        instructorId: dto.instructorId,
        cohortId: dto.cohortId,
        title: dto.title,
        code: dto.code,
        status: dto.status ?? CourseRunStatus.DRAFT,
        capacity: dto.capacity ?? 30,
        enrollmentOpensAt: dto.enrollmentOpensAt ? new Date(dto.enrollmentOpensAt) : undefined,
        enrollmentClosesAt: dto.enrollmentClosesAt ? new Date(dto.enrollmentClosesAt) : undefined,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        timezone: dto.timezone ?? 'Asia/Ho_Chi_Minh',
        deliveryMode: dto.deliveryMode ?? 'online',
        location: dto.location,
        onlineMeetingUrl: dto.onlineMeetingUrl,
        notes: dto.notes,
      },
      include: this.runInclude(),
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCourseRunDto) {
    const current = await this.prisma.courseRun.findFirst({
      where: { id, tenantId },
      select: { id: true, instructorId: true, startsAt: true, endsAt: true },
    });

    if (!current) {
      throw new NotFoundException('Course run not found');
    }

    if (dto.courseId) await this.ensureCourse(tenantId, dto.courseId);
    if (dto.instructorId) await this.ensureInstructor(tenantId, dto.instructorId);
    if (Object.prototype.hasOwnProperty.call(dto, 'cohortId')) {
      await this.ensureOptionalCohort(tenantId, dto.cohortId);
    }

    const nextInstructorId = dto.instructorId ?? current.instructorId;
    const nextStartsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
    const nextEndsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;

    if (nextStartsAt && nextEndsAt) {
      this.ensureDateOrder(nextStartsAt, nextEndsAt, 'Run end time must be after start time');
      await this.ensureInstructorHasNoConflict(
        tenantId,
        nextInstructorId,
        nextStartsAt.toISOString(),
        nextEndsAt.toISOString(),
        id,
      );
    }

    this.validateWindow(
      dto.enrollmentOpensAt,
      dto.enrollmentClosesAt,
      'Enrollment close time must be after open time',
    );

    return this.prisma.courseRun.update({
      where: { id_tenantId: { id, tenantId } },
      data: this.courseRunUpdateData(dto),
      include: this.runInclude(),
    });
  }

  async addEnrollments(tenantId: string, id: string, dto: AddRunEnrollmentsDto) {
    const run = await this.prisma.courseRun.findFirst({
      where: { id, tenantId },
      select: { id: true, capacity: true, _count: { select: { enrollments: true } } },
    });
    if (!run) throw new NotFoundException('Course run not found');

    const validUsers = await this.prisma.user.findMany({
      where: { tenantId, id: { in: dto.userIds }, role: Role.STUDENT, deletedAt: null },
      select: { id: true },
    });
    if (validUsers.length !== dto.userIds.length) {
      throw new BadRequestException('One or more students do not exist in this tenant');
    }

    const existing = await this.prisma.runEnrollment.findMany({
      where: { tenantId, runId: id, userId: { in: dto.userIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((entry) => entry.userId));
    const toCreate = dto.userIds.filter((userId) => !existingIds.has(userId));
    if (run._count.enrollments + toCreate.length > run.capacity) {
      throw new BadRequestException('Course run capacity would be exceeded');
    }

    if (toCreate.length > 0) {
      await this.prisma.runEnrollment.createMany({
        data: toCreate.map((userId) => ({
          tenantId,
          runId: id,
          userId,
          status: RunEnrollmentStatus.ENROLLED,
        })),
        skipDuplicates: true,
      });
    }

    return {
      addedCount: toCreate.length,
      skippedCount: existingIds.size,
      capacity: run.capacity,
    };
  }

  async createSession(
    tenantId: string,
    runId: string,
    user: CourseRunUser,
    dto: CreateRunSessionDto,
  ) {
    const run = await this.get(tenantId, runId, user);
    const instructorId = dto.instructorId ?? run.instructorId;
    if (user.role === Role.INSTRUCTOR && instructorId !== user.id) {
      throw new ForbiddenException('Instructor can only schedule their own sessions');
    }
    await this.ensureInstructor(tenantId, instructorId);
    await this.ensureOptionalLesson(tenantId, run.courseId, dto.lessonId);
    this.validateWindow(dto.startsAt, dto.endsAt, 'Session end time must be after start time');
    await this.ensureInstructorHasNoSessionConflict(
      tenantId,
      instructorId,
      dto.startsAt,
      dto.endsAt,
    );

    return this.prisma.runSession.create({
      data: {
        tenantId,
        runId,
        instructorId,
        lessonId: dto.lessonId,
        title: dto.title,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        timezone: dto.timezone ?? run.timezone,
        location: dto.location,
        onlineMeetingUrl: dto.onlineMeetingUrl,
        notes: dto.notes,
      },
      include: this.sessionInclude(),
    });
  }

  async upsertAttendance(
    tenantId: string,
    sessionId: string,
    user: CourseRunUser,
    dto: UpsertAttendanceDto,
  ) {
    const session = await this.prisma.runSession.findFirst({
      where: {
        id: sessionId,
        tenantId,
        ...(user.role === Role.INSTRUCTOR ? { run: { instructorId: user.id, tenantId } } : {}),
      },
      select: { id: true, runId: true },
    });
    if (!session) {
      throw new NotFoundException('Run session not found');
    }

    const enrolledUsers = await this.prisma.runEnrollment.findMany({
      where: {
        tenantId,
        runId: session.runId,
        userId: { in: dto.entries.map((entry) => entry.userId) },
      },
      select: { userId: true },
    });
    const enrolledIds = new Set(enrolledUsers.map((entry) => entry.userId));
    const notEnrolled = dto.entries.find((entry) => !enrolledIds.has(entry.userId));
    if (notEnrolled) {
      throw new BadRequestException(`Student ${notEnrolled.userId} is not enrolled in this run`);
    }

    return this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.attendance.upsert({
          where: { sessionId_userId: { sessionId, userId: entry.userId } },
          update: {
            status: entry.status,
            note: entry.note,
            markedById: user.id,
            markedAt: new Date(),
          },
          create: {
            tenantId,
            sessionId,
            userId: entry.userId,
            status: entry.status,
            note: entry.note,
            markedById: user.id,
          },
        }),
      ),
    );
  }

  private runWhereForUser(tenantId: string, user: CourseRunUser): Prisma.CourseRunWhereInput {
    return {
      tenantId,
      ...(user.role === Role.INSTRUCTOR ? { instructorId: user.id } : {}),
    };
  }

  private runInclude() {
    return {
      course: { select: { id: true, title: true, languageCode: true, proficiencyLevel: true } },
      cohort: { select: { id: true, name: true } },
      instructor: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      _count: { select: { enrollments: true, sessions: true } },
    } satisfies Prisma.CourseRunInclude;
  }

  private sessionInclude() {
    return {
      instructor: { select: { id: true, fullName: true, email: true } },
      lesson: { select: { id: true, title: true, type: true } },
      _count: { select: { attendances: true } },
    } satisfies Prisma.RunSessionInclude;
  }

  private async ensureCourse(tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: this.learningAccess.courseWhere(tenantId, undefined, courseId, {
        includeInactive: true,
      }),
      select: { id: true, deletedAt: true },
    });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
  }

  private async ensureInstructor(tenantId: string, instructorId: string) {
    const instructor = await this.prisma.user.findFirst({
      where: { id: instructorId, tenantId, role: Role.INSTRUCTOR, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!instructor) throw new BadRequestException('Instructor is not active in this tenant');
  }

  private async ensureOptionalCohort(tenantId: string, cohortId?: string | null) {
    if (!cohortId) return;
    const cohort = await this.prisma.cohort.findFirst({
      where: { id: cohortId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!cohort) throw new BadRequestException('Cohort not found in this tenant');
  }

  private async ensureOptionalLesson(tenantId: string, courseId: string, lessonId?: string | null) {
    if (!lessonId) return;
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId, courseId, deletedAt: null },
      select: { id: true },
    });
    if (!lesson) throw new BadRequestException('Lesson not found in this course');
  }

  private validateWindow(start?: string, end?: string, message?: string) {
    if (!start || !end) return;
    this.ensureDateOrder(
      new Date(start),
      new Date(end),
      message ?? 'End time must be after start time',
    );
  }

  private ensureDateOrder(start: Date, end: Date, message: string) {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new BadRequestException(message);
    }
  }

  private async ensureInstructorHasNoConflict(
    tenantId: string,
    instructorId: string,
    startsAt: string,
    endsAt: string,
    excludeRunId?: string,
  ) {
    const conflict = await this.prisma.courseRun.findFirst({
      where: {
        tenantId,
        instructorId,
        id: excludeRunId ? { not: excludeRunId } : undefined,
        startsAt: { lt: new Date(endsAt) },
        endsAt: { gt: new Date(startsAt) },
        status: { notIn: [CourseRunStatus.CANCELLED, CourseRunStatus.COMPLETED] },
      },
      select: { id: true },
    });
    if (conflict) throw new BadRequestException('Instructor has a conflicting course run');
  }

  private async ensureInstructorHasNoSessionConflict(
    tenantId: string,
    instructorId: string,
    startsAt: string,
    endsAt: string,
  ) {
    const conflict = await this.prisma.runSession.findFirst({
      where: {
        tenantId,
        instructorId,
        startsAt: { lt: new Date(endsAt) },
        endsAt: { gt: new Date(startsAt) },
      },
      select: { id: true },
    });
    if (conflict) throw new BadRequestException('Instructor has a conflicting session');
  }

  private courseRunUpdateData(dto: UpdateCourseRunDto): Prisma.CourseRunUncheckedUpdateInput {
    return {
      courseId: dto.courseId,
      instructorId: dto.instructorId,
      cohortId: dto.cohortId,
      title: dto.title,
      code: dto.code,
      status: dto.status,
      capacity: dto.capacity,
      enrollmentOpensAt: dto.enrollmentOpensAt ? new Date(dto.enrollmentOpensAt) : undefined,
      enrollmentClosesAt: dto.enrollmentClosesAt ? new Date(dto.enrollmentClosesAt) : undefined,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      timezone: dto.timezone,
      deliveryMode: dto.deliveryMode,
      location: dto.location,
      onlineMeetingUrl: dto.onlineMeetingUrl,
      notes: dto.notes,
    };
  }
}
