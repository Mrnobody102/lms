import { Injectable } from '@nestjs/common';
import { ExamAttemptStatus, LearningActivityType, ProgressStatus, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { SrsService } from '../srs/srs.service';

interface StudentTodayUser {
  id: string;
  role: Role;
}

type TodayTaskType =
  | 'ACTIVE_EXAM'
  | 'REVIEW_DUE'
  | 'CONTINUE_COURSE'
  | 'WEAK_SKILL_PRACTICE'
  | 'BROWSE_COURSES';

interface TodayTask {
  id: string;
  type: TodayTaskType;
  title: string;
  subtitle: string;
  href: string;
  priority: number;
  dueAt: Date | null;
  meta: Record<string, string | number | boolean | null>;
}

@Injectable()
export class StudentTodayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
    private readonly srs: SrsService,
  ) {}

  async getToday(tenantId: string, user: StudentTodayUser) {
    const [courses, activeAttempts, srsDue, weakMastery, recentPractice, recentExams] =
      await Promise.all([
        this.getCourseContinuations(tenantId, user),
        this.getActiveExamAttempts(tenantId, user),
        this.safeGetDueSummary(tenantId, user.id),
        this.prisma.skillMastery.findFirst({
          where: { tenantId, userId: user.id },
          orderBy: [{ mastery: 'asc' }, { attempts: 'desc' }],
        }),
        this.prisma.practiceAttempt.findMany({
          where: {
            tenantId,
            userId: user.id,
            status: 'SUBMITTED',
            OR: [{ courseId: null }, { course: this.learningAccess.courseWhere(tenantId, user) }],
          },
          include: {
            exerciseSet: {
              select: {
                id: true,
                title: true,
                course: { select: { id: true, title: true } },
                unit: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
          take: 3,
        }),
        this.prisma.examAttempt.findMany({
          where: {
            tenantId,
            userId: user.id,
            status: ExamAttemptStatus.SUBMITTED,
            OR: [{ courseId: null }, { course: this.learningAccess.courseWhere(tenantId, user) }],
          },
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                course: { select: { id: true, title: true } },
                unit: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
          take: 3,
        }),
      ]);

    const tasks: TodayTask[] = [];
    const activeAttempt = activeAttempts[0] ?? null;
    if (activeAttempt) {
      tasks.push({
        id: `active-exam-${activeAttempt.id}`,
        type: 'ACTIVE_EXAM',
        title: activeAttempt.exam.title,
        subtitle: activeAttempt.exam.course?.title ?? 'Exam in progress',
        href: `/exams/${activeAttempt.exam.id}`,
        priority: 100,
        dueAt: activeAttempt.deadlineAt,
        meta: {
          attemptId: activeAttempt.id,
          courseId: activeAttempt.courseId,
          durationMinutes: activeAttempt.exam.durationMinutes,
        },
      });
    }

    if (srsDue.dueNow > 0) {
      tasks.push({
        id: 'review-due',
        type: 'REVIEW_DUE',
        title: `${srsDue.dueNow}`,
        subtitle: 'review cards due now',
        href: '/practice?tab=review',
        priority: 90,
        dueAt: null,
        meta: {
          dueNow: srsDue.dueNow,
          dueToday: srsDue.dueToday,
          total: srsDue.total,
        },
      });
    }

    const continueCourse = courses.find((course) => course.continueLesson);
    if (continueCourse?.continueLesson) {
      tasks.push({
        id: `continue-${continueCourse.course.id}`,
        type: 'CONTINUE_COURSE',
        title: continueCourse.continueLesson.title,
        subtitle: continueCourse.course.title,
        href: `/lessons/${continueCourse.continueLesson.id}`,
        priority: 70,
        dueAt: null,
        meta: {
          courseId: continueCourse.course.id,
          completionPercentage: continueCourse.completionPercentage,
          durationMinutes: continueCourse.continueLesson.duration,
        },
      });
    }

    if (weakMastery && weakMastery.mastery < 0.6) {
      tasks.push({
        id: `weak-skill-${weakMastery.skillCode}`,
        type: 'WEAK_SKILL_PRACTICE',
        title: weakMastery.skillCode,
        subtitle: 'weak skill practice',
        href: `/practice?skill=${encodeURIComponent(weakMastery.skillCode)}`,
        priority: 60,
        dueAt: null,
        meta: {
          skillCode: weakMastery.skillCode,
          mastery: Math.round(weakMastery.mastery * 100),
          attempts: weakMastery.attempts,
        },
      });
    }

    if (tasks.length === 0) {
      tasks.push({
        id: 'browse-courses',
        type: 'BROWSE_COURSES',
        title: 'Browse courses',
        subtitle: 'choose the next course activity',
        href: '/courses',
        priority: 10,
        dueAt: null,
        meta: {},
      });
    }

    const sortedTasks = tasks.sort((a, b) => b.priority - a.priority);

    return {
      primaryTask: sortedTasks[0],
      tasks: sortedTasks,
      courses,
      srsDue,
      recentFeedback: {
        practice: recentPractice.map((attempt) => ({
          id: attempt.id,
          title: attempt.exerciseSet.title,
          courseTitle: attempt.exerciseSet.course?.title ?? null,
          unitTitle: attempt.exerciseSet.unit?.title ?? null,
          score: attempt.score,
          totalPoints: attempt.totalPoints,
          percentage: this.toScorePercent(attempt.score, attempt.totalPoints),
          submittedAt: attempt.submittedAt,
          href: `/practice/attempts/${attempt.id}`,
        })),
        exams: recentExams.map((attempt) => ({
          id: attempt.id,
          title: attempt.exam.title,
          courseTitle: attempt.exam.course?.title ?? null,
          unitTitle: attempt.exam.unit?.title ?? null,
          score: attempt.score,
          totalPoints: attempt.totalPoints,
          percentage: this.toScorePercent(attempt.score, attempt.totalPoints),
          submittedAt: attempt.submittedAt,
          href: `/exams/attempts/${attempt.id}`,
        })),
      },
    };
  }

  private async getCourseContinuations(tenantId: string, user: StudentTodayUser) {
    const courses = await this.prisma.course.findMany({
      where: this.learningAccess.courseWhere(tenantId, user),
      select: {
        id: true,
        title: true,
        totalDuration: true,
        createdAt: true,
        _count: {
          select: {
            lessons: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const courseIds = courses.map((course) => course.id);
    if (courseIds.length === 0) return [];

    const [completedLessonsData, continueLessonsData, lastActivities] = await Promise.all([
      this.prisma.lesson.findMany({
        where: {
          courseId: { in: courseIds },
          deletedAt: null,
          progress: {
            some: {
              tenantId,
              userId: user.id,
              status: ProgressStatus.COMPLETED,
            },
          },
        },
        select: { courseId: true },
      }),
      Promise.all(
        courses.map(async (course) => {
          const continueLesson = await this.prisma.lesson.findFirst({
            where: {
              courseId: course.id,
              deletedAt: null,
              progress: {
                none: {
                  tenantId,
                  userId: user.id,
                  status: ProgressStatus.COMPLETED,
                },
              },
            },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              courseId: true,
              duration: true,
            },
          });
          return { courseId: course.id, continueLesson };
        }),
      ),
      Promise.all(
        courses.map(async (course) => {
          const activity = await this.prisma.learningActivity.findFirst({
            where: {
              tenantId,
              userId: user.id,
              courseId: course.id,
              type: LearningActivityType.LESSON_OPENED,
            },
            orderBy: { occurredAt: 'desc' },
            select: { occurredAt: true },
          });
          return { courseId: course.id, occurredAt: activity?.occurredAt ?? null };
        }),
      ),
    ]);

    const completedCountByCourse = completedLessonsData.reduce(
      (acc, curr) => {
        acc[curr.courseId] = (acc[curr.courseId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    type ContinueLessonType = {
      id: string;
      title: string;
      courseId: string;
      duration: number;
    } | null;
    const continueLessonByCourse = continueLessonsData.reduce(
      (acc, curr) => {
        acc[curr.courseId] = curr.continueLesson;
        return acc;
      },
      {} as Record<string, ContinueLessonType>,
    );

    const lastActivityByCourse = lastActivities.reduce(
      (acc, curr) => {
        acc[curr.courseId] = curr.occurredAt;
        return acc;
      },
      {} as Record<string, Date | null>,
    );

    return courses.map((course) => {
      const totalLessons = course._count.lessons;
      const completedLessons = completedCountByCourse[course.id] || 0;
      const continueLesson = continueLessonByCourse[course.id];
      const completionPercentage =
        totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

      return {
        course: {
          id: course.id,
          title: course.title,
          totalDuration: course.totalDuration,
        },
        totalLessons,
        completedLessons,
        completionPercentage,
        lastActivityAt: lastActivityByCourse[course.id] ?? null,
        continueLesson: continueLesson
          ? {
              id: continueLesson.id,
              title: continueLesson.title,
              courseId: continueLesson.courseId,
              duration: continueLesson.duration,
            }
          : null,
      };
    });
  }

  private async getActiveExamAttempts(tenantId: string, user: StudentTodayUser) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        tenantId,
        userId: user.id,
        status: ExamAttemptStatus.STARTED,
        OR: [{ courseId: null }, { course: this.learningAccess.courseWhere(tenantId, user) }],
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    return attempts
      .map((attempt) => ({
        ...attempt,
        deadlineAt: new Date(attempt.startedAt.getTime() + attempt.exam.durationMinutes * 60_000),
      }))
      .filter((attempt) => attempt.deadlineAt.getTime() > Date.now());
  }

  private async safeGetDueSummary(tenantId: string, userId: string) {
    try {
      return await this.srs.getDueSummary(tenantId, userId);
    } catch {
      return { dueNow: 0, dueToday: 0, total: 0 };
    }
  }

  private toScorePercent(score: number, totalPoints: number) {
    return totalPoints <= 0 ? 0 : Math.round((score / totalPoints) * 100);
  }
}
