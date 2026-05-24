import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EnrollmentStatus,
  ExamAttemptStatus,
  PracticeAttemptStatus,
  ProgressStatus,
} from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { CohortComparisonQueryDto } from './dto/cohort-comparison-query.dto';

interface CohortComparisonRow {
  cohortId: string;
  cohortName: string;
  learnerCount: number;
  completionRate: number;
  activitySessions: number;
  practiceAccuracy: number;
  examAccuracy: number;
  mastery: number;
  overdueSrsCards: number;
  rank: number;
  deltaCompletion: number;
}

@Injectable()
export class CohortComparisonService {
  constructor(private readonly prisma: PrismaService) {}

  async getComparison(tenantId: string, query: CohortComparisonQueryDto) {
    await this.ensureCourse(tenantId, query.courseId);
    const cohorts = await this.resolveCohorts(tenantId, query.cohortIds);
    const rows = await Promise.all(
      cohorts.map((cohort) => this.computeCohortMetrics(tenantId, cohort, query)),
    );
    const sorted = [...rows].sort((a, b) => b.completionRate - a.completionRate);
    const rankByCohort = new Map(sorted.map((row, index) => [row.cohortId, index + 1]));
    const baseline = sorted[0]?.completionRate ?? 0;

    return {
      data: rows.map((row) => ({
        ...row,
        rank: rankByCohort.get(row.cohortId) ?? 0,
        deltaCompletion: row.completionRate - baseline,
      })),
      filters: query,
    };
  }

  private async computeCohortMetrics(
    tenantId: string,
    cohort: { id: string; name: string },
    query: CohortComparisonQueryDto,
  ): Promise<CohortComparisonRow> {
    const dateFilter = {
      ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
      ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
    };
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    const userWhere = {
      cohortMemberships: {
        some: { tenantId, cohortId: cohort.id },
      },
    };

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        tenantId,
        courseId: query.courseId,
        status: EnrollmentStatus.ACTIVE,
        user: userWhere,
      },
      select: { userId: true, courseId: true },
    });

    const userIds = [...new Set(enrollments.map((enrollment) => enrollment.userId))];
    const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.courseId))];
    if (userIds.length === 0 || courseIds.length === 0) {
      return this.emptyRow(cohort);
    }

    const [lessons, completedProgress, activityCount, practice, exams, mastery, overdueSrs] =
      await Promise.all([
        this.prisma.lesson.groupBy({
          by: ['courseId'],
          where: { tenantId, courseId: { in: courseIds }, deletedAt: null },
          _count: { id: true },
        }),
        this.prisma.userLessonProgress.findMany({
          where: {
            tenantId,
            userId: { in: userIds },
            status: ProgressStatus.COMPLETED,
            lesson: { courseId: { in: courseIds }, deletedAt: null },
            ...(hasDateFilter ? { updatedAt: dateFilter } : {}),
          },
          select: {
            userId: true,
            lesson: { select: { courseId: true } },
          },
        }),
        this.prisma.learningActivity.count({
          where: {
            tenantId,
            userId: { in: userIds },
            courseId: { in: courseIds },
            ...(hasDateFilter ? { occurredAt: dateFilter } : {}),
          },
        }),
        this.prisma.practiceAttempt.aggregate({
          where: {
            tenantId,
            userId: { in: userIds },
            courseId: { in: courseIds },
            status: PracticeAttemptStatus.SUBMITTED,
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
          _sum: { score: true, totalPoints: true },
        }),
        this.prisma.examAttempt.aggregate({
          where: {
            tenantId,
            userId: { in: userIds },
            courseId: { in: courseIds },
            status: ExamAttemptStatus.SUBMITTED,
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
          _sum: { score: true, totalPoints: true },
        }),
        this.prisma.skillMastery.aggregate({
          where: { tenantId, userId: { in: userIds } },
          _avg: { mastery: true },
        }),
        this.prisma.reviewCard.count({
          where: {
            tenantId,
            userId: { in: userIds },
            isSuspended: false,
            dueAt: { lt: new Date() },
          },
        }),
      ]);

    const lessonCountByCourse = new Map(lessons.map((row) => [row.courseId, row._count.id]));
    const enrollmentKeys = new Set(
      enrollments.map((enrollment) => this.userCourseKey(enrollment.userId, enrollment.courseId)),
    );
    const completedCount = completedProgress.filter((progress) =>
      enrollmentKeys.has(this.userCourseKey(progress.userId, progress.lesson.courseId)),
    ).length;
    const expectedCompletions = enrollments.reduce(
      (sum, enrollment) => sum + (lessonCountByCourse.get(enrollment.courseId) ?? 0),
      0,
    );

    return {
      cohortId: cohort.id,
      cohortName: cohort.name,
      learnerCount: userIds.length,
      completionRate: this.percent(completedCount, expectedCompletions),
      activitySessions: activityCount,
      practiceAccuracy: this.percent(practice._sum.score, practice._sum.totalPoints),
      examAccuracy: this.percent(exams._sum.score, exams._sum.totalPoints),
      mastery: Math.round(mastery._avg.mastery ?? 0),
      overdueSrsCards: overdueSrs,
      rank: 0,
      deltaCompletion: 0,
    };
  }

  private async resolveCohorts(tenantId: string, cohortIds?: string[]) {
    const where = {
      tenantId,
      deletedAt: null,
      isActive: true,
      ...(cohortIds?.length ? { id: { in: cohortIds } } : {}),
    };
    const cohorts = await this.prisma.cohort.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    if (cohortIds?.length && cohorts.length !== cohortIds.length) {
      throw new NotFoundException('One or more cohorts were not found in this tenant');
    }

    return cohorts;
  }

  private async ensureCourse(tenantId: string, courseId?: string) {
    if (!courseId) return;
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found in this tenant');
  }

  private emptyRow(cohort: { id: string; name: string }): CohortComparisonRow {
    return {
      cohortId: cohort.id,
      cohortName: cohort.name,
      learnerCount: 0,
      completionRate: 0,
      activitySessions: 0,
      practiceAccuracy: 0,
      examAccuracy: 0,
      mastery: 0,
      overdueSrsCards: 0,
      rank: 0,
      deltaCompletion: 0,
    };
  }

  private percent(numerator?: number | null, denominator?: number | null) {
    const n = numerator ?? 0;
    const d = denominator ?? 0;
    if (d === 0) return 0;
    return Math.round((n / d) * 100);
  }

  private userCourseKey(userId: string, courseId: string) {
    return `${userId}:${courseId}`;
  }
}
