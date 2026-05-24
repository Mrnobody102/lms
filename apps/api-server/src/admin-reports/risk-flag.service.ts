import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EnrollmentStatus,
  ExamAttemptStatus,
  PracticeAttemptStatus,
  Prisma,
  ProgressStatus,
  RiskFlagType,
  RiskSeverity,
} from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { RiskReportQueryDto } from './dto/risk-report-query.dto';

interface RiskReason {
  flag: RiskFlagType;
  message: string;
  value?: number;
  threshold?: number;
}

interface RiskRow {
  userId: string;
  fullName: string;
  email: string;
  courseId: string;
  courseTitle: string;
  cohortIds: string[];
  severity: RiskSeverity;
  score: number;
  flags: RiskFlagType[];
  reasons: RiskReason[];
  computedAt: Date;
}

interface EffectiveRiskRule {
  type: RiskFlagType;
  severity: RiskSeverity;
  config: Record<string, Prisma.JsonValue>;
}

interface ScoreTrend {
  recentAccuracy: number;
  previousAccuracy: number;
  drop: number;
}

interface ScoreAttemptRow {
  userId: string;
  courseId: string;
  score: number;
  totalPoints: number;
  createdAt: Date;
}

const DEFAULT_RISK_RULES: Record<RiskFlagType, EffectiveRiskRule> = {
  [RiskFlagType.NO_ACTIVITY]: {
    type: RiskFlagType.NO_ACTIVITY,
    severity: RiskSeverity.MEDIUM,
    config: { days: 7 },
  },
  [RiskFlagType.FALLING_BEHIND]: {
    type: RiskFlagType.FALLING_BEHIND,
    severity: RiskSeverity.MEDIUM,
    config: { days: 14, completion: 20 },
  },
  [RiskFlagType.LOW_MASTERY]: {
    type: RiskFlagType.LOW_MASTERY,
    severity: RiskSeverity.MEDIUM,
    config: { accuracy: 50 },
  },
  [RiskFlagType.OVERDUE_SRS]: {
    type: RiskFlagType.OVERDUE_SRS,
    severity: RiskSeverity.LOW,
    config: { count: 10 },
  },
  [RiskFlagType.DECLINING_SCORE]: {
    type: RiskFlagType.DECLINING_SCORE,
    severity: RiskSeverity.MEDIUM,
    config: { windowDays: 14, drop: 15 },
  },
};

@Injectable()
export class RiskFlagService {
  constructor(private readonly prisma: PrismaService) {}

  async listRiskFlags(tenantId: string, query: RiskReportQueryDto) {
    await this.ensureCourse(tenantId, query.courseId);
    await this.ensureCohort(tenantId, query.cohortId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const rows = await this.computeRiskRows(tenantId, {
      courseId: query.courseId,
      cohortId: query.cohortId,
    });
    const filtered = rows.filter((row) => {
      if (query.severity && row.severity !== query.severity) return false;
      if (query.flag && !row.flags.includes(query.flag)) return false;
      return row.flags.length > 0;
    });
    const total = filtered.length;
    const data = filtered.slice((page - 1) * limit, page * limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async recomputeRiskSnapshots(tenantId: string, query: RiskReportQueryDto) {
    await this.ensureCourse(tenantId, query.courseId);
    await this.ensureCohort(tenantId, query.cohortId);

    const rows = (
      await this.computeRiskRows(tenantId, {
        courseId: query.courseId,
        cohortId: query.cohortId,
      })
    ).filter((row) => row.flags.length > 0);

    await this.prisma.$transaction(async (tx) => {
      await tx.studentRiskSnapshot.deleteMany({
        where: {
          tenantId,
          courseId: query.courseId,
          cohortId: query.cohortId,
        },
      });

      if (rows.length > 0) {
        await tx.studentRiskSnapshot.createMany({
          data: rows.map((row) => ({
            tenantId,
            userId: row.userId,
            courseId: row.courseId,
            cohortId: query.cohortId,
            severity: row.severity,
            score: row.score,
            flags: row.flags,
            reasons: row.reasons as unknown as Prisma.InputJsonValue,
            computedAt: row.computedAt,
          })),
        });
      }
    });

    return { computed: rows.length };
  }

  private async computeRiskRows(
    tenantId: string,
    filters: { courseId?: string; cohortId?: string },
  ): Promise<RiskRow[]> {
    const computedAt = new Date();
    const riskRules = await this.getRiskRules(tenantId);
    const decliningRule = riskRules.get(RiskFlagType.DECLINING_SCORE);
    const trendWindowDays = decliningRule
      ? this.numberConfig(decliningRule.config, 'windowDays', 14)
      : 14;
    const cohortUserWhere = this.cohortUserWhere(tenantId, filters.cohortId);
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        tenantId,
        status: EnrollmentStatus.ACTIVE,
        courseId: filters.courseId,
        ...(cohortUserWhere ? { user: cohortUserWhere } : {}),
      },
      select: {
        userId: true,
        courseId: true,
        enrolledAt: true,
        user: {
          select: {
            fullName: true,
            email: true,
            cohortMemberships: { where: { tenantId }, select: { cohortId: true } },
          },
        },
        course: { select: { title: true } },
      },
    });

    if (enrollments.length === 0) {
      return [];
    }

    const userIds = [...new Set(enrollments.map((enrollment) => enrollment.userId))];
    const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.courseId))];

    const [
      lessonCounts,
      completedProgress,
      activities,
      practice,
      exams,
      practiceAttempts,
      examAttempts,
      overdueSrs,
    ] = await Promise.all([
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
        },
        select: { userId: true, lesson: { select: { courseId: true } } },
      }),
      this.prisma.learningActivity.findMany({
        where: { tenantId, userId: { in: userIds }, courseId: { in: courseIds } },
        select: { userId: true, courseId: true, occurredAt: true },
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.practiceAttempt.groupBy({
        by: ['userId', 'courseId'],
        where: {
          tenantId,
          userId: { in: userIds },
          courseId: { in: courseIds },
          status: PracticeAttemptStatus.SUBMITTED,
        },
        _sum: { score: true, totalPoints: true },
      }),
      this.prisma.examAttempt.groupBy({
        by: ['userId', 'courseId'],
        where: {
          tenantId,
          userId: { in: userIds },
          courseId: { in: courseIds },
          status: ExamAttemptStatus.SUBMITTED,
        },
        _sum: { score: true, totalPoints: true },
      }),
      this.prisma.practiceAttempt.findMany({
        where: {
          tenantId,
          userId: { in: userIds },
          courseId: { in: courseIds },
          status: PracticeAttemptStatus.SUBMITTED,
        },
        select: { userId: true, courseId: true, score: true, totalPoints: true, createdAt: true },
      }),
      this.prisma.examAttempt.findMany({
        where: {
          tenantId,
          userId: { in: userIds },
          courseId: { in: courseIds },
          status: ExamAttemptStatus.SUBMITTED,
        },
        select: { userId: true, courseId: true, score: true, totalPoints: true, createdAt: true },
      }),
      this.prisma.reviewCard.groupBy({
        by: ['userId'],
        where: {
          tenantId,
          userId: { in: userIds },
          isSuspended: false,
          dueAt: { lt: computedAt },
        },
        _count: { id: true },
      }),
    ]);

    const lessonsByCourse = new Map(lessonCounts.map((row) => [row.courseId, row._count.id]));
    const completedByUserCourse = new Map<string, number>();
    for (const progress of completedProgress) {
      const key = this.userCourseKey(progress.userId, progress.lesson.courseId);
      completedByUserCourse.set(key, (completedByUserCourse.get(key) ?? 0) + 1);
    }

    const lastActivityByUserCourse = new Map<string, Date>();
    for (const activity of activities) {
      const key = this.userCourseKey(activity.userId, activity.courseId);
      if (!lastActivityByUserCourse.has(key)) {
        lastActivityByUserCourse.set(key, activity.occurredAt);
      }
    }

    const practiceByUserCourse = new Map(
      practice.map((row) => [
        this.userCourseKey(row.userId, row.courseId),
        { score: row._sum.score ?? 0, total: row._sum.totalPoints ?? 0 },
      ]),
    );
    const examByUserCourse = new Map(
      exams.map((row) => [
        this.userCourseKey(row.userId, row.courseId),
        { score: row._sum.score ?? 0, total: row._sum.totalPoints ?? 0 },
      ]),
    );
    const overdueByUser = new Map(overdueSrs.map((row) => [row.userId, row._count.id]));
    const decliningScoresByUserCourse = this.buildDecliningScoreMap(
      [...practiceAttempts, ...examAttempts],
      computedAt,
      trendWindowDays,
    );

    return enrollments.map((enrollment) => {
      const key = this.userCourseKey(enrollment.userId, enrollment.courseId);
      const lessonCount = lessonsByCourse.get(enrollment.courseId) ?? 0;
      const completedLessons = completedByUserCourse.get(key) ?? 0;
      const completion = lessonCount === 0 ? 0 : Math.round((completedLessons / lessonCount) * 100);
      const lastActivityAt = lastActivityByUserCourse.get(key) ?? null;
      const practiceAccuracy = this.percent(
        practiceByUserCourse.get(key)?.score,
        practiceByUserCourse.get(key)?.total,
      );
      const examAccuracy = this.percent(
        examByUserCourse.get(key)?.score,
        examByUserCourse.get(key)?.total,
      );
      const overdueCount = overdueByUser.get(enrollment.userId) ?? 0;
      const { flags, reasons, score } = this.evaluateRisk({
        enrolledAt: enrollment.enrolledAt,
        completion,
        lastActivityAt,
        practiceAccuracy,
        examAccuracy,
        overdueCount,
        scoreTrend: decliningScoresByUserCourse.get(key),
        now: computedAt,
        rules: riskRules,
      });

      return {
        userId: enrollment.userId,
        fullName: enrollment.user.fullName,
        email: enrollment.user.email,
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        cohortIds: enrollment.user.cohortMemberships.map((membership) => membership.cohortId),
        severity: this.severityForScore(score),
        score,
        flags,
        reasons,
        computedAt,
      };
    });
  }

  private evaluateRisk(input: {
    enrolledAt: Date;
    completion: number;
    lastActivityAt: Date | null;
    practiceAccuracy: number;
    examAccuracy: number;
    overdueCount: number;
    scoreTrend?: ScoreTrend;
    now: Date;
    rules: Map<RiskFlagType, EffectiveRiskRule>;
  }) {
    const flags: RiskFlagType[] = [];
    const reasons: RiskReason[] = [];
    let score = 0;
    const enrolledDays = this.diffDays(input.now, input.enrolledAt);
    const inactiveDays = input.lastActivityAt
      ? this.diffDays(input.now, input.lastActivityAt)
      : enrolledDays;
    const noActivityRule = input.rules.get(RiskFlagType.NO_ACTIVITY);
    const fallingBehindRule = input.rules.get(RiskFlagType.FALLING_BEHIND);
    const lowMasteryRule = input.rules.get(RiskFlagType.LOW_MASTERY);
    const overdueSrsRule = input.rules.get(RiskFlagType.OVERDUE_SRS);
    const decliningScoreRule = input.rules.get(RiskFlagType.DECLINING_SCORE);

    if (noActivityRule && inactiveDays > this.numberConfig(noActivityRule.config, 'days', 7)) {
      flags.push(RiskFlagType.NO_ACTIVITY);
      reasons.push({
        flag: RiskFlagType.NO_ACTIVITY,
        message: 'No learning activity within threshold',
        value: inactiveDays,
        threshold: this.numberConfig(noActivityRule.config, 'days', 7),
      });
      score += this.scoreWeight(noActivityRule.severity);
    }

    if (
      fallingBehindRule &&
      enrolledDays > this.numberConfig(fallingBehindRule.config, 'days', 14) &&
      input.completion < this.numberConfig(fallingBehindRule.config, 'completion', 20)
    ) {
      flags.push(RiskFlagType.FALLING_BEHIND);
      reasons.push({
        flag: RiskFlagType.FALLING_BEHIND,
        message: 'Completion is below expected progress',
        value: input.completion,
        threshold: this.numberConfig(fallingBehindRule.config, 'completion', 20),
      });
      score += this.scoreWeight(fallingBehindRule.severity);
    }

    const accuracyValues = [input.practiceAccuracy, input.examAccuracy].filter(
      (value) => value > 0,
    );
    if (lowMasteryRule && accuracyValues.length > 0) {
      const averageAccuracy = Math.round(
        accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length,
      );
      if (averageAccuracy < this.numberConfig(lowMasteryRule.config, 'accuracy', 50)) {
        flags.push(RiskFlagType.LOW_MASTERY);
        reasons.push({
          flag: RiskFlagType.LOW_MASTERY,
          message: 'Assessment accuracy is below mastery threshold',
          value: averageAccuracy,
          threshold: this.numberConfig(lowMasteryRule.config, 'accuracy', 50),
        });
        score += this.scoreWeight(lowMasteryRule.severity);
      }
    }

    if (
      overdueSrsRule &&
      input.overdueCount > this.numberConfig(overdueSrsRule.config, 'count', 10)
    ) {
      flags.push(RiskFlagType.OVERDUE_SRS);
      reasons.push({
        flag: RiskFlagType.OVERDUE_SRS,
        message: 'Overdue SRS cards exceed threshold',
        value: input.overdueCount,
        threshold: this.numberConfig(overdueSrsRule.config, 'count', 10),
      });
      score += this.scoreWeight(overdueSrsRule.severity);
    }

    if (
      decliningScoreRule &&
      input.scoreTrend &&
      input.scoreTrend.drop >= this.numberConfig(decliningScoreRule.config, 'drop', 15)
    ) {
      flags.push(RiskFlagType.DECLINING_SCORE);
      reasons.push({
        flag: RiskFlagType.DECLINING_SCORE,
        message: 'Recent assessment accuracy declined compared to the previous window',
        value: input.scoreTrend.drop,
        threshold: this.numberConfig(decliningScoreRule.config, 'drop', 15),
      });
      score += this.scoreWeight(decliningScoreRule.severity);
    }

    return { flags, reasons, score };
  }

  private async getRiskRules(tenantId: string) {
    const rows = await this.prisma.reportingRiskRule.findMany({
      where: { tenantId },
      select: { type: true, severity: true, config: true, isEnabled: true },
    });
    const rowByType = new Map(rows.map((row) => [row.type, row]));
    const rules = new Map<RiskFlagType, EffectiveRiskRule>();

    for (const type of Object.values(RiskFlagType) as RiskFlagType[]) {
      const defaults = DEFAULT_RISK_RULES[type];
      const row = rowByType.get(type);
      if (row?.isEnabled === false) {
        continue;
      }

      rules.set(type, {
        type,
        severity: row?.severity ?? defaults.severity,
        config: {
          ...defaults.config,
          ...this.jsonObject(row?.config),
        },
      });
    }

    return rules;
  }

  private buildDecliningScoreMap(
    attempts: ScoreAttemptRow[],
    now: Date,
    windowDays: number,
  ): Map<string, ScoreTrend> {
    const currentWindowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const previousWindowStart = new Date(now.getTime() - windowDays * 2 * 24 * 60 * 60 * 1000);
    const buckets = new Map<
      string,
      { recentScore: number; recentTotal: number; previousScore: number; previousTotal: number }
    >();

    for (const attempt of attempts) {
      if (attempt.totalPoints <= 0 || attempt.createdAt < previousWindowStart) {
        continue;
      }

      const key = this.userCourseKey(attempt.userId, attempt.courseId);
      const bucket = buckets.get(key) ?? {
        previousScore: 0,
        previousTotal: 0,
        recentScore: 0,
        recentTotal: 0,
      };

      if (attempt.createdAt >= currentWindowStart) {
        bucket.recentScore += attempt.score;
        bucket.recentTotal += attempt.totalPoints;
      } else {
        bucket.previousScore += attempt.score;
        bucket.previousTotal += attempt.totalPoints;
      }
      buckets.set(key, bucket);
    }

    const trends = new Map<string, ScoreTrend>();
    for (const [key, bucket] of buckets) {
      if (bucket.recentTotal === 0 || bucket.previousTotal === 0) {
        continue;
      }

      const recentAccuracy = this.percent(bucket.recentScore, bucket.recentTotal);
      const previousAccuracy = this.percent(bucket.previousScore, bucket.previousTotal);
      trends.set(key, {
        recentAccuracy,
        previousAccuracy,
        drop: Math.max(0, previousAccuracy - recentAccuracy),
      });
    }

    return trends;
  }

  private async ensureCourse(tenantId: string, courseId?: string) {
    if (!courseId) return;
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found in this tenant');
  }

  private async ensureCohort(tenantId: string, cohortId?: string) {
    if (!cohortId) return;
    const cohort = await this.prisma.cohort.findFirst({
      where: { id: cohortId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!cohort) throw new NotFoundException('Cohort not found in this tenant');
  }

  private cohortUserWhere(tenantId: string, cohortId?: string) {
    if (!cohortId) return undefined;
    return {
      cohortMemberships: {
        some: { tenantId, cohortId },
      },
    };
  }

  private userCourseKey(userId: string, courseId: string) {
    return `${userId}:${courseId}`;
  }

  private severityForScore(score: number) {
    if (score >= 70) return RiskSeverity.HIGH;
    if (score >= 40) return RiskSeverity.MEDIUM;
    return RiskSeverity.LOW;
  }

  private scoreWeight(severity: RiskSeverity) {
    if (severity === RiskSeverity.HIGH) return 35;
    if (severity === RiskSeverity.MEDIUM) return 25;
    return 15;
  }

  private diffDays(now: Date, then: Date) {
    return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  }

  private numberConfig(config: Record<string, Prisma.JsonValue>, key: string, fallback: number) {
    const value = config[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private jsonObject(value: Prisma.JsonValue | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, Prisma.JsonValue>;
  }

  private percent(numerator?: number | null, denominator?: number | null) {
    const n = numerator ?? 0;
    const d = denominator ?? 0;
    if (d === 0) return 0;
    return Math.round((n / d) * 100);
  }
}
