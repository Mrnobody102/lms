import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EnrollmentStatus,
  ExamAttemptStatus,
  PracticeAttemptStatus,
  ProgressStatus,
  LearningActivityType,
  Prisma,
} from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { buildAnswerAccuracy, type AccuracyReport } from '../common/utils/answer-accuracy.util';

const CSV_ROW_CAP = 5000;
const DEFAULT_TREND_DAYS = 30;
const MAX_TREND_DAYS = 90;

interface ReportFilters {
  cohortId?: string;
  startDate?: string;
  endDate?: string;
}

interface CourseReportFilters extends ReportFilters {
  courseId?: string;
  programId?: string;
}

interface TrendReportFilters extends CourseReportFilters {
  days?: number;
  cohortIds?: string[];
}

interface CourseAccuracyBucket {
  practiceScore: number;
  practiceTotal: number;
  practiceAttempts: number;
  examScore: number;
  examTotal: number;
  examAttempts: number;
}

interface CourseRollupRow {
  courseId: string;
  title: string;
  enrollmentCount: number;
  lessonCount: number;
  completionRate: number;
  practiceAccuracy: number;
  examAccuracy: number;
}

@Injectable()
export class AdminReportsService {
  static readonly CSV_ROW_CAP = CSV_ROW_CAP;

  constructor(private readonly prisma: PrismaService) {}

  async getProgramsRollup(tenantId: string, filters: ReportFilters = {}) {
    await this.ensureCohortInTenant(tenantId, filters.cohortId);

    const [programs, unassignedCourses] = await Promise.all([
      this.prisma.program.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { title: 'asc' },
        include: {
          _count: { select: { levels: { where: { deletedAt: null } } } },
          levels: {
            where: { deletedAt: null },
            select: {
              id: true,
              courses: {
                where: { tenantId, deletedAt: null },
                select: { id: true },
              },
            },
          },
        },
      }),
      this.prisma.course.findMany({
        where: { tenantId, deletedAt: null, levelId: null },
        select: { id: true },
      }),
    ]);

    const allCourseIds = new Set<string>();
    const programCourseIds = new Map<string, string[]>();

    for (const program of programs) {
      const courseIds: string[] = [];
      for (const level of program.levels) {
        for (const course of level.courses) {
          courseIds.push(course.id);
          allCourseIds.add(course.id);
        }
      }
      programCourseIds.set(program.id, courseIds);
    }

    const unassignedIds = unassignedCourses.map((c) => c.id);
    unassignedIds.forEach((id) => allCourseIds.add(id));

    const metrics = await this.computeCourseMetrics(tenantId, [...allCourseIds], filters);

    const programRows = programs.map((program) => {
      const courseIds = programCourseIds.get(program.id) ?? [];
      const rollup = this.foldCourseMetrics(courseIds, metrics);
      return {
        id: program.id,
        title: program.title,
        levelCount: program._count.levels,
        courseCount: courseIds.length,
        ...rollup,
      };
    });

    const unassigned =
      unassignedIds.length === 0
        ? null
        : {
            id: null,
            title: 'Unassigned',
            levelCount: 0,
            courseCount: unassignedIds.length,
            ...this.foldCourseMetrics(unassignedIds, metrics),
          };

    return { programs: programRows, unassigned };
  }

  async getProgramDetail(tenantId: string, programId: string, filters: ReportFilters = {}) {
    await this.ensureCohortInTenant(tenantId, filters.cohortId);

    const program = await this.prisma.program.findFirst({
      where: { id: programId, tenantId, deletedAt: null },
      include: {
        levels: {
          where: { deletedAt: null },
          orderBy: [{ order: 'asc' }, { title: 'asc' }],
          include: {
            courses: {
              where: { tenantId, deletedAt: null },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException(`Program not found in this tenant`);
    }

    const allCourseIds = program.levels.flatMap((level) => level.courses.map((c) => c.id));
    const metrics = await this.computeCourseMetrics(tenantId, allCourseIds, filters);

    const levels = program.levels.map((level) => {
      const courseIds = level.courses.map((c) => c.id);
      return {
        id: level.id,
        title: level.title,
        order: level.order,
        courseCount: courseIds.length,
        ...this.foldCourseMetrics(courseIds, metrics),
      };
    });

    return {
      program: {
        id: program.id,
        title: program.title,
        description: program.description,
      },
      levels,
    };
  }

  async getLevelDetail(tenantId: string, levelId: string, filters: ReportFilters = {}) {
    await this.ensureCohortInTenant(tenantId, filters.cohortId);

    const level = await this.prisma.level.findFirst({
      where: {
        id: levelId,
        tenantId,
        deletedAt: null,
        program: { tenantId, deletedAt: null },
      },
      include: {
        program: { select: { id: true, title: true } },
        courses: {
          where: { tenantId, deletedAt: null },
          orderBy: { title: 'asc' },
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!level) {
      throw new NotFoundException(`Level not found in this tenant`);
    }

    const courseIds = level.courses.map((c) => c.id);
    const metrics = await this.computeCourseMetrics(tenantId, courseIds, filters);

    const courses: CourseRollupRow[] = level.courses.map((course) => {
      const bucket = metrics.byCourse.get(course.id);
      return {
        courseId: course.id,
        title: course.title,
        enrollmentCount: metrics.enrollmentsByCourse.get(course.id) ?? 0,
        lessonCount: metrics.lessonsByCourse.get(course.id) ?? 0,
        completionRate: this.computeCourseCompletionRate(course.id, metrics),
        practiceAccuracy: this.percent(bucket?.practiceScore, bucket?.practiceTotal),
        examAccuracy: this.percent(bucket?.examScore, bucket?.examTotal),
      };
    });

    return {
      level: {
        id: level.id,
        title: level.title,
        order: level.order,
      },
      program: level.program,
      courses,
    };
  }

  async getCourseUnits(tenantId: string, courseId: string, filters: ReportFilters = {}) {
    await this.ensureCohortInTenant(tenantId, filters.cohortId);

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null },
      select: { id: true, title: true },
    });
    if (!course) {
      throw new NotFoundException(`Course not found in this tenant`);
    }

    const units = await this.prisma.courseUnit.findMany({
      where: { tenantId, courseId, deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { lessons: { where: { deletedAt: null } } },
        },
      },
    });

    const accuracy = await this.computeUnitAccuracy(tenantId, courseId, filters);

    const unitRows = units.map((unit) => {
      const unitAcc = accuracy.unitMap.get(unit.id);
      return {
        id: unit.id,
        title: unit.title,
        order: unit.order,
        lessonCount: unit._count.lessons,
        accuracy: unitAcc?.accuracy ?? 0,
        totalQuestions: unitAcc?.totalQuestions ?? 0,
      };
    });

    return {
      course: { id: course.id, title: course.title },
      units: unitRows,
    };
  }

  async getCourseStudents(tenantId: string, courseId: string, filters: ReportFilters = {}) {
    await this.ensureCohortInTenant(tenantId, filters.cohortId);

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null },
      select: {
        id: true,
        title: true,
        lessons: { where: { deletedAt: null }, select: { id: true } },
        enrollments: {
          where: {
            tenantId,
            status: EnrollmentStatus.ACTIVE,
            ...this.cohortUserWhere(tenantId, filters.cohortId),
          },
          orderBy: { enrolledAt: 'desc' },
          select: {
            id: true,
            userId: true,
            enrolledAt: true,
            user: {
              select: { id: true, email: true, fullName: true, isActive: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course not found in this tenant`);
    }

    const learnerIds = course.enrollments.map((e) => e.userId);
    const lessonCount = course.lessons.length;

    const dateFilter = {
      ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
      ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
    };
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [progressRecords, activityRecords, practiceAggregates, examAggregates] =
      await Promise.all([
        learnerIds.length === 0
          ? Promise.resolve([])
          : this.prisma.userLessonProgress.findMany({
              where: {
                tenantId,
                userId: { in: learnerIds },
                status: ProgressStatus.COMPLETED,
                lesson: { courseId, deletedAt: null },
                ...this.cohortUserWhere(tenantId, filters.cohortId),
                ...(hasDateFilter ? { updatedAt: dateFilter } : {}),
              },
              select: { userId: true },
            }),
        learnerIds.length === 0
          ? Promise.resolve([])
          : this.prisma.learningActivity.findMany({
              where: {
                tenantId,
                courseId,
                userId: { in: learnerIds },
                ...this.cohortUserWhere(tenantId, filters.cohortId),
                ...(hasDateFilter ? { occurredAt: dateFilter } : {}),
              },
              select: { userId: true, occurredAt: true },
              orderBy: { occurredAt: 'desc' },
            }),
        learnerIds.length === 0
          ? Promise.resolve([])
          : this.prisma.practiceAttempt.groupBy({
              by: ['userId'],
              where: {
                tenantId,
                courseId,
                userId: { in: learnerIds },
                status: PracticeAttemptStatus.SUBMITTED,
                ...this.cohortUserWhere(tenantId, filters.cohortId),
                ...(hasDateFilter ? { createdAt: dateFilter } : {}),
              },
              _sum: { score: true, totalPoints: true },
              _count: { id: true },
            }),
        learnerIds.length === 0
          ? Promise.resolve([])
          : this.prisma.examAttempt.groupBy({
              by: ['userId'],
              where: {
                tenantId,
                courseId,
                userId: { in: learnerIds },
                status: ExamAttemptStatus.SUBMITTED,
                ...this.cohortUserWhere(tenantId, filters.cohortId),
                ...(hasDateFilter ? { createdAt: dateFilter } : {}),
              },
              _sum: { score: true, totalPoints: true },
              _count: { id: true },
            }),
      ]);

    const completedByUser = new Map<string, number>();
    for (const record of progressRecords) {
      completedByUser.set(record.userId, (completedByUser.get(record.userId) ?? 0) + 1);
    }
    const lastActivityByUser = new Map<string, Date>();
    for (const record of activityRecords) {
      if (!lastActivityByUser.has(record.userId)) {
        lastActivityByUser.set(record.userId, record.occurredAt);
      }
    }
    const practiceByUser = new Map(
      practiceAggregates.map((a) => [
        a.userId,
        {
          attempts: a._count.id,
          score: a._sum.score ?? 0,
          totalPoints: a._sum.totalPoints ?? 0,
        },
      ]),
    );
    const examByUser = new Map(
      examAggregates.map((a) => [
        a.userId,
        {
          attempts: a._count.id,
          score: a._sum.score ?? 0,
          totalPoints: a._sum.totalPoints ?? 0,
        },
      ]),
    );

    const students = course.enrollments.map((enrollment) => {
      const completedLessons = completedByUser.get(enrollment.userId) ?? 0;
      const completionPercentage =
        lessonCount === 0 ? 0 : Math.round((completedLessons / lessonCount) * 100);
      const practice = practiceByUser.get(enrollment.userId);
      const exam = examByUser.get(enrollment.userId);
      const practiceAccuracy = this.percent(practice?.score, practice?.totalPoints);
      const examAccuracy = this.percent(exam?.score, exam?.totalPoints);
      const lastActivityAt = lastActivityByUser.get(enrollment.userId) ?? null;

      const riskFlags: ('NO_ACTIVITY' | 'FALLING_BEHIND' | 'LOW_MASTERY')[] = [];
      const now = new Date();
      const enrolledDays = Math.floor(
        (now.getTime() - enrollment.enrolledAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (!lastActivityAt) {
        if (enrolledDays > 7) riskFlags.push('NO_ACTIVITY');
      } else {
        const inactiveDays = Math.floor(
          (now.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (inactiveDays > 7) riskFlags.push('NO_ACTIVITY');
      }

      if (enrolledDays > 14 && completionPercentage < 20) {
        riskFlags.push('FALLING_BEHIND');
      }

      const hasPractice = practiceAccuracy !== null;
      const hasExam = examAccuracy !== null;
      if (hasPractice || hasExam) {
        const avg =
          ((practiceAccuracy ?? 0) + (examAccuracy ?? 0)) /
          ((hasPractice ? 1 : 0) + (hasExam ? 1 : 0));
        if (avg < 50) riskFlags.push('LOW_MASTERY');
      }

      return {
        userId: enrollment.userId,
        fullName: enrollment.user.fullName,
        email: enrollment.user.email,
        isActive: enrollment.user.isActive,
        enrolledAt: enrollment.enrolledAt,
        completedLessons,
        totalLessons: lessonCount,
        completionPercentage,
        practiceAccuracy,
        examAccuracy,
        practiceAttempts: practice?.attempts ?? 0,
        examAttempts: exam?.attempts ?? 0,
        lastActivityAt,
        riskFlags,
      };
    });

    return {
      course: { id: course.id, title: course.title },
      students,
    };
  }

  async getSkillsAccuracy(
    tenantId: string,
    filters: CourseReportFilters = {},
  ): Promise<AccuracyReport & { filters: CourseReportFilters }> {
    await this.ensureCohortInTenant(tenantId, filters.cohortId);
    const courseFilter = await this.resolveCourseFilter(tenantId, filters);

    const dateFilter = {
      ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
      ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
    };
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [practiceAnswers, examAnswers] = await Promise.all([
      this.prisma.practiceAnswer.findMany({
        where: {
          tenantId,
          attempt: {
            tenantId,
            status: PracticeAttemptStatus.SUBMITTED,
            ...(courseFilter ? { courseId: courseFilter } : {}),
            ...this.cohortUserWhere(tenantId, filters.cohortId),
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        include: {
          question: {
            select: {
              unitId: true,
              skillTags: true,
              unit: { select: { title: true } },
            },
          },
        },
      }),
      this.prisma.examAnswer.findMany({
        where: {
          tenantId,
          attempt: {
            tenantId,
            status: ExamAttemptStatus.SUBMITTED,
            ...(courseFilter ? { courseId: courseFilter } : {}),
            ...this.cohortUserWhere(tenantId, filters.cohortId),
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        include: {
          question: {
            select: {
              skillTags: true,
              section: {
                include: {
                  exam: {
                    select: {
                      unitId: true,
                      unit: { select: { title: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const items = [
      ...practiceAnswers.map((a) => ({
        isCorrect: a.isCorrect,
        unitId: a.question.unitId,
        unitTitle: a.question.unit?.title ?? null,
        skillTags: a.question.skillTags,
      })),
      ...examAnswers.map((a) => ({
        isCorrect: a.isCorrect,
        unitId: a.question.section.exam.unitId,
        unitTitle: a.question.section.exam.unit?.title ?? null,
        skillTags: a.question.skillTags,
      })),
    ];

    return { ...buildAnswerAccuracy(items), filters };
  }

  private async resolveCourseFilter(
    tenantId: string,
    filters: { courseId?: string; programId?: string },
  ): Promise<string | { in: string[] } | undefined> {
    if (filters.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: filters.courseId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!course) {
        throw new NotFoundException(`Course not found in this tenant`);
      }
      return filters.courseId;
    }
    if (filters.programId) {
      const program = await this.prisma.program.findFirst({
        where: { id: filters.programId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!program) {
        throw new NotFoundException(`Program not found in this tenant`);
      }
      const courses = await this.prisma.course.findMany({
        where: {
          tenantId,
          deletedAt: null,
          level: { programId: filters.programId, tenantId, deletedAt: null },
        },
        select: { id: true },
      });
      return { in: courses.map((c) => c.id) };
    }
    return undefined;
  }

  async getActivityTrend(tenantId: string, filters: TrendReportFilters = {}) {
    if (filters.cohortId) {
      await this.ensureCohortInTenant(tenantId, filters.cohortId);
    }
    const courseFilter = await this.resolveCourseFilter(tenantId, filters);
    const { startDate, days } = this.getTrendWindow(filters.days);

    const cohortIds = filters.cohortIds?.length
      ? filters.cohortIds
      : filters.cohortId
        ? [filters.cohortId]
        : [null];

    const cohortNames = new Map<string, string>();
    if (filters.cohortIds?.length) {
      const cohorts = await this.prisma.cohort.findMany({
        where: { tenantId, id: { in: filters.cohortIds } },
        select: { id: true, name: true },
      });
      cohorts.forEach((c) => cohortNames.set(c.id, c.name));
    } else if (filters.cohortId) {
      const cohort = await this.prisma.cohort.findFirst({
        where: { tenantId, id: filters.cohortId },
        select: { id: true, name: true },
      });
      if (cohort) cohortNames.set(cohort.id, cohort.name);
    }

    const series = await Promise.all(
      cohortIds.map(async (cohortId) => {
        const records = await this.prisma.learningActivity.findMany({
          where: {
            tenantId,
            occurredAt: { gte: startDate },
            ...(courseFilter ? { courseId: courseFilter } : {}),
            ...this.cohortUserWhere(tenantId, cohortId || undefined),
          },
          select: {
            occurredAt: true,
            type: true,
          },
        });

        const trendMap = new Map<string, { date: string; opened: number; completed: number }>();

        for (let i = 0; i < days; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          trendMap.set(dateStr, { date: dateStr, opened: 0, completed: 0 });
        }

        for (const record of records) {
          const dateStr = record.occurredAt.toISOString().split('T')[0];
          const bucket = trendMap.get(dateStr);
          if (bucket) {
            if (record.type === LearningActivityType.LESSON_OPENED) bucket.opened += 1;
            if (record.type === LearningActivityType.LESSON_COMPLETED) bucket.completed += 1;
          }
        }

        return {
          cohortId: cohortId || 'all',
          cohortName: cohortId ? cohortNames.get(cohortId) || 'Unknown' : 'All Students',
          trend: Array.from(trendMap.values()),
        };
      }),
    );

    return { series };
  }

  async getMasteryTrend(tenantId: string, filters: TrendReportFilters = {}) {
    if (filters.cohortIds?.length) {
      for (const cohortId of filters.cohortIds) await this.ensureCohortInTenant(tenantId, cohortId);
    } else if (filters.cohortId) {
      await this.ensureCohortInTenant(tenantId, filters.cohortId);
    }
    const { startDate, days } = this.getTrendWindow(filters.days);

    const cohortIds = filters.cohortIds?.length
      ? filters.cohortIds
      : filters.cohortId
        ? [filters.cohortId]
        : [null];

    const cohortNames = new Map<string, string>();
    if (filters.cohortIds?.length) {
      const cohorts = await this.prisma.cohort.findMany({
        where: { tenantId, id: { in: filters.cohortIds } },
        select: { id: true, name: true },
      });
      cohorts.forEach((c) => cohortNames.set(c.id, c.name));
    } else if (filters.cohortId) {
      const cohort = await this.prisma.cohort.findFirst({
        where: { tenantId, id: filters.cohortId },
        select: { id: true, name: true },
      });
      if (cohort) cohortNames.set(cohort.id, cohort.name);
    }

    const series = await Promise.all(
      cohortIds.map(async (cohortId) => {
        const whereClause: Prisma.SkillMasterySnapshotWhereInput = {
          tenantId,
          date: { gte: startDate },
        };

        if (cohortId) {
          whereClause.user = {
            cohortMemberships: {
              some: { tenantId, cohortId },
            },
          };
        }

        const records = await this.prisma.skillMasterySnapshot.findMany({
          where: whereClause,
          select: {
            skillCode: true,
            mastery: true,
            date: true,
          },
        });

        const trendMap = new Map<string, Record<string, number | string>>();

        for (let i = 0; i < days; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          trendMap.set(dateStr, { date: dateStr });
        }

        const aggregated = new Map<
          string,
          { [skillCode: string]: { sum: number; count: number } }
        >();

        for (const record of records) {
          const dateStr = record.date.toISOString().split('T')[0];
          let dayAgg = aggregated.get(dateStr);
          if (!dayAgg) {
            dayAgg = {};
            aggregated.set(dateStr, dayAgg);
          }
          if (!dayAgg[record.skillCode]) {
            dayAgg[record.skillCode] = { sum: 0, count: 0 };
          }
          dayAgg[record.skillCode].sum += record.mastery;
          dayAgg[record.skillCode].count += 1;
        }

        for (const [dateStr, dayAgg] of aggregated.entries()) {
          const bucket = trendMap.get(dateStr);
          if (bucket) {
            for (const [skillCode, stats] of Object.entries(dayAgg)) {
              bucket[skillCode] = stats.count === 0 ? 0 : Math.round(stats.sum / stats.count);
            }
          }
        }

        return {
          cohortId: cohortId || 'all',
          cohortName: cohortId ? cohortNames.get(cohortId) || 'Unknown' : 'All Students',
          trend: Array.from(trendMap.values()),
        };
      }),
    );

    return { series };
  }

  private async computeUnitAccuracy(tenantId: string, courseId: string, filters: ReportFilters) {
    const dateFilter = {
      ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
      ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
    };
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [practiceAnswers, examAnswers] = await Promise.all([
      this.prisma.practiceAnswer.findMany({
        where: {
          tenantId,
          attempt: {
            tenantId,
            courseId,
            status: PracticeAttemptStatus.SUBMITTED,
            ...this.cohortUserWhere(tenantId, filters.cohortId),
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        select: {
          isCorrect: true,
          question: {
            select: {
              unitId: true,
              skillTags: true,
              unit: { select: { title: true } },
            },
          },
        },
      }),
      this.prisma.examAnswer.findMany({
        where: {
          tenantId,
          attempt: {
            tenantId,
            courseId,
            status: ExamAttemptStatus.SUBMITTED,
            ...this.cohortUserWhere(tenantId, filters.cohortId),
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        select: {
          isCorrect: true,
          question: {
            select: {
              skillTags: true,
              section: {
                select: {
                  exam: {
                    select: {
                      unitId: true,
                      unit: { select: { title: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const items = [
      ...practiceAnswers.map((a) => ({
        isCorrect: a.isCorrect,
        unitId: a.question.unitId,
        unitTitle: a.question.unit?.title ?? null,
        skillTags: a.question.skillTags,
      })),
      ...examAnswers.map((a) => ({
        isCorrect: a.isCorrect,
        unitId: a.question.section.exam.unitId,
        unitTitle: a.question.section.exam.unit?.title ?? null,
        skillTags: a.question.skillTags,
      })),
    ];

    const report = buildAnswerAccuracy(items);
    const unitMap = new Map(report.accuracyByUnit.map((u) => [u.id, u]));
    return { unitMap, ...report };
  }

  private async computeCourseMetrics(
    tenantId: string,
    courseIds: string[],
    filters: ReportFilters = {},
  ) {
    if (courseIds.length === 0) {
      return {
        byCourse: new Map<string, CourseAccuracyBucket>(),
        enrollmentsByCourse: new Map<string, number>(),
        lessonsByCourse: new Map<string, number>(),
        completedLessonsByCourse: new Map<string, number>(),
      };
    }

    const [practice, exam, enrollments, lessons, completedProgress] = await Promise.all([
      this.prisma.practiceAttempt.groupBy({
        by: ['courseId'],
        where: {
          tenantId,
          courseId: { in: courseIds },
          status: PracticeAttemptStatus.SUBMITTED,
          ...this.cohortUserWhere(tenantId, filters.cohortId),
        },
        _sum: { score: true, totalPoints: true },
        _count: { id: true },
      }),
      this.prisma.examAttempt.groupBy({
        by: ['courseId'],
        where: {
          tenantId,
          courseId: { in: courseIds },
          status: ExamAttemptStatus.SUBMITTED,
          ...this.cohortUserWhere(tenantId, filters.cohortId),
        },
        _sum: { score: true, totalPoints: true },
        _count: { id: true },
      }),
      this.prisma.courseEnrollment.groupBy({
        by: ['courseId'],
        where: {
          tenantId,
          courseId: { in: courseIds },
          status: EnrollmentStatus.ACTIVE,
          ...this.cohortUserWhere(tenantId, filters.cohortId),
        },
        _count: { id: true },
      }),
      this.prisma.lesson.groupBy({
        by: ['courseId'],
        where: { tenantId, courseId: { in: courseIds }, deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.userLessonProgress.findMany({
        where: {
          tenantId,
          status: ProgressStatus.COMPLETED,
          lesson: { courseId: { in: courseIds }, deletedAt: null },
          ...this.cohortUserWhere(tenantId, filters.cohortId),
        },
        select: {
          userId: true,
          lesson: { select: { courseId: true } },
        },
      }),
    ]);

    const byCourse = new Map<string, CourseAccuracyBucket>();
    for (const id of courseIds) {
      byCourse.set(id, {
        practiceScore: 0,
        practiceTotal: 0,
        practiceAttempts: 0,
        examScore: 0,
        examTotal: 0,
        examAttempts: 0,
      });
    }
    for (const row of practice) {
      if (!row.courseId) continue;
      const bucket = byCourse.get(row.courseId);
      if (!bucket) continue;
      bucket.practiceScore = row._sum.score ?? 0;
      bucket.practiceTotal = row._sum.totalPoints ?? 0;
      bucket.practiceAttempts = row._count.id;
    }
    for (const row of exam) {
      if (!row.courseId) continue;
      const bucket = byCourse.get(row.courseId);
      if (!bucket) continue;
      bucket.examScore = row._sum.score ?? 0;
      bucket.examTotal = row._sum.totalPoints ?? 0;
      bucket.examAttempts = row._count.id;
    }

    const enrollmentsByCourse = new Map(enrollments.map((e) => [e.courseId, e._count.id]));
    const lessonsByCourse = new Map(lessons.map((l) => [l.courseId, l._count.id]));

    const completedLessonsByCourse = new Map<string, number>();
    for (const record of completedProgress) {
      const courseId = record.lesson.courseId;
      completedLessonsByCourse.set(courseId, (completedLessonsByCourse.get(courseId) ?? 0) + 1);
    }

    return { byCourse, enrollmentsByCourse, lessonsByCourse, completedLessonsByCourse };
  }

  private foldCourseMetrics(
    courseIds: string[],
    metrics: Awaited<ReturnType<AdminReportsService['computeCourseMetrics']>>,
  ) {
    let practiceScore = 0;
    let practiceTotal = 0;
    let examScore = 0;
    let examTotal = 0;
    let enrollmentCount = 0;
    let lessonCount = 0;
    let completedLessons = 0;

    for (const id of courseIds) {
      const bucket = metrics.byCourse.get(id);
      if (bucket) {
        practiceScore += bucket.practiceScore;
        practiceTotal += bucket.practiceTotal;
        examScore += bucket.examScore;
        examTotal += bucket.examTotal;
      }
      enrollmentCount += metrics.enrollmentsByCourse.get(id) ?? 0;
      const courseLessons = metrics.lessonsByCourse.get(id) ?? 0;
      lessonCount += courseLessons;
      completedLessons += metrics.completedLessonsByCourse.get(id) ?? 0;
    }

    const expectedCompletions = courseIds.reduce((acc, id) => {
      const courseLessons = metrics.lessonsByCourse.get(id) ?? 0;
      const enrollments = metrics.enrollmentsByCourse.get(id) ?? 0;
      return acc + courseLessons * enrollments;
    }, 0);

    return {
      enrollmentCount,
      lessonCount,
      completionRate: this.percent(completedLessons, expectedCompletions),
      practiceAccuracy: this.percent(practiceScore, practiceTotal),
      examAccuracy: this.percent(examScore, examTotal),
    };
  }

  private computeCourseCompletionRate(
    courseId: string,
    metrics: Awaited<ReturnType<AdminReportsService['computeCourseMetrics']>>,
  ) {
    const lessonCount = metrics.lessonsByCourse.get(courseId) ?? 0;
    const enrollmentCount = metrics.enrollmentsByCourse.get(courseId) ?? 0;
    const completed = metrics.completedLessonsByCourse.get(courseId) ?? 0;
    const expected = lessonCount * enrollmentCount;
    return this.percent(completed, expected);
  }

  private async ensureCohortInTenant(tenantId: string, cohortId?: string): Promise<void> {
    if (!cohortId) return;

    const cohort = await this.prisma.cohort.findFirst({
      where: { id: cohortId, tenantId },
      select: { id: true },
    });

    if (!cohort) {
      throw new NotFoundException(`Cohort not found in this tenant`);
    }
  }

  private cohortUserWhere(tenantId: string, cohortId?: string | string[]) {
    if (!cohortId || (Array.isArray(cohortId) && cohortId.length === 0)) return {};
    return {
      user: {
        cohortMemberships: {
          some: {
            tenantId,
            cohortId: Array.isArray(cohortId) ? { in: cohortId } : cohortId,
          },
        },
      },
    };
  }

  private getTrendWindow(days?: number): { startDate: Date; days: number } {
    const windowDays = Math.min(Math.max(days ?? DEFAULT_TREND_DAYS, 1), MAX_TREND_DAYS);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (windowDays - 1));
    startDate.setHours(0, 0, 0, 0);

    return { startDate, days: windowDays };
  }

  private percent(numerator?: number | null, denominator?: number | null) {
    const n = numerator ?? 0;
    const d = denominator ?? 0;
    if (d === 0) return 0;
    return Math.round((n / d) * 100);
  }
}
