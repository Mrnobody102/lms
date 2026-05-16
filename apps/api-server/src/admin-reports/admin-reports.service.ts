import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EnrollmentStatus,
  ExamAttemptStatus,
  PracticeAttemptStatus,
  ProgressStatus,
  LearningActivityType,
} from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { buildAnswerAccuracy, type AccuracyReport } from '../common/utils/answer-accuracy.util';

const CSV_ROW_CAP = 5000;

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

  async getProgramsRollup(tenantId: string) {
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

    const metrics = await this.computeCourseMetrics(tenantId, [...allCourseIds]);

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

  async getProgramDetail(tenantId: string, programId: string) {
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
    const metrics = await this.computeCourseMetrics(tenantId, allCourseIds);

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

  async getLevelDetail(tenantId: string, levelId: string) {
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
    const metrics = await this.computeCourseMetrics(tenantId, courseIds);

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

  async getCourseUnits(tenantId: string, courseId: string) {
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

    const accuracy = await this.computeUnitAccuracy(tenantId, courseId);

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

  async getCourseStudents(tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null },
      select: {
        id: true,
        title: true,
        lessons: { where: { deletedAt: null }, select: { id: true } },
        enrollments: {
          where: { tenantId, status: EnrollmentStatus.ACTIVE },
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
      return {
        userId: enrollment.userId,
        fullName: enrollment.user.fullName,
        email: enrollment.user.email,
        isActive: enrollment.user.isActive,
        enrolledAt: enrollment.enrolledAt,
        completedLessons,
        totalLessons: lessonCount,
        completionPercentage,
        practiceAccuracy: this.percent(practice?.score, practice?.totalPoints),
        examAccuracy: this.percent(exam?.score, exam?.totalPoints),
        practiceAttempts: practice?.attempts ?? 0,
        examAttempts: exam?.attempts ?? 0,
        lastActivityAt: lastActivityByUser.get(enrollment.userId) ?? null,
      };
    });

    return {
      course: { id: course.id, title: course.title },
      students,
    };
  }

  async getSkillsAccuracy(
    tenantId: string,
    filters: { courseId?: string; programId?: string } = {},
  ): Promise<AccuracyReport & { filters: { courseId?: string; programId?: string } }> {
    const courseFilter = await this.resolveCourseFilter(tenantId, filters);

    const [practiceAnswers, examAnswers] = await Promise.all([
      this.prisma.practiceAnswer.findMany({
        where: {
          tenantId,
          attempt: {
            tenantId,
            status: PracticeAttemptStatus.SUBMITTED,
            ...(courseFilter ? { courseId: courseFilter } : {}),
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

  async getActivityTrend(
    tenantId: string,
    filters: { courseId?: string; programId?: string } = {},
  ) {
    const courseFilter = await this.resolveCourseFilter(tenantId, filters);

    // Get last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const records = await this.prisma.learningActivity.findMany({
      where: {
        tenantId,
        occurredAt: { gte: startDate },
        ...(courseFilter ? { courseId: courseFilter } : {}),
      },
      select: {
        occurredAt: true,
        type: true,
      },
    });

    // Bucket by day (YYYY-MM-DD)
    const trendMap = new Map<string, { date: string; opened: number; completed: number }>();

    // Initialize the last 7 days with 0
    for (let i = 0; i < 7; i++) {
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
      trend: Array.from(trendMap.values()),
    };
  }

  private async computeUnitAccuracy(tenantId: string, courseId: string) {
    const [practiceAnswers, examAnswers] = await Promise.all([
      this.prisma.practiceAnswer.findMany({
        where: {
          tenantId,
          attempt: { tenantId, courseId, status: PracticeAttemptStatus.SUBMITTED },
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
          attempt: { tenantId, courseId, status: ExamAttemptStatus.SUBMITTED },
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

  private async computeCourseMetrics(tenantId: string, courseIds: string[]) {
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
      const bucket = byCourse.get(row.courseId);
      if (!bucket) continue;
      bucket.practiceScore = row._sum.score ?? 0;
      bucket.practiceTotal = row._sum.totalPoints ?? 0;
      bucket.practiceAttempts = row._count.id;
    }
    for (const row of exam) {
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

  private percent(numerator?: number | null, denominator?: number | null) {
    const n = numerator ?? 0;
    const d = denominator ?? 0;
    if (d === 0) return 0;
    return Math.round((n / d) * 100);
  }
}
