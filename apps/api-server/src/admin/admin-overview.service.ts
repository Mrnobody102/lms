import { Injectable } from '@nestjs/common';
import { EnrollmentStatus, ProgressStatus, Role } from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class AdminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(scope: { tenantId: string }) {
    const tenantId = scope.tenantId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const studentWhere = {
      tenantId,
      role: Role.STUDENT,
      deletedAt: null,
    } as const;

    const [
      totalStudents,
      newStudents7d,
      inactiveStudents,
      activeCourses,
      activeEnrollments,
      trackedSessions,
      recentRegistrations,
      enrollments,
    ] = await Promise.all([
      this.prisma.user.count({
        where: studentWhere,
      }),
      this.prisma.user.count({
        where: {
          ...studentWhere,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.user.count({
        where: {
          ...studentWhere,
          isActive: false,
        },
      }),
      this.prisma.course.count({
        where: {
          tenantId,
          deletedAt: null,
          isActive: true,
        },
      }),
      this.prisma.courseEnrollment.count({
        where: {
          tenantId,
          status: EnrollmentStatus.ACTIVE,
        },
      }),
      this.prisma.learningActivity.count({
        where: {
          tenantId,
          type: 'LESSON_OPENED',
        },
      }),
      this.prisma.user.findMany({
        where: studentWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          createdAt: true,
          enrollments: {
            where: { tenantId, status: EnrollmentStatus.ACTIVE },
            orderBy: { enrolledAt: 'desc' },
            take: 1,
            select: {
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.courseEnrollment.findMany({
        where: {
          tenantId,
          status: EnrollmentStatus.ACTIVE,
        },
        select: {
          userId: true,
          courseId: true,
        },
      }),
    ]);

    const completionRate = await this.calculateEnrollmentCompletionRate(tenantId, enrollments);

    return {
      totals: {
        totalStudents,
        newStudents7d,
        inactiveStudents,
        activeCourses,
        activeEnrollments,
        trackedSessions,
        completionRate,
      },
      recentRegistrations: recentRegistrations.map((student) => ({
        id: student.id,
        email: student.email,
        fullName: student.fullName,
        isActive: student.isActive,
        createdAt: student.createdAt,
        latestCourseTitle: student.enrollments[0]?.course.title ?? null,
      })),
    };
  }

  private async calculateEnrollmentCompletionRate(
    tenantId: string,
    enrollments: Array<{ userId: string; courseId: string }>,
  ) {
    if (enrollments.length === 0) {
      return 0;
    }

    const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.courseId))];
    const userIds = [...new Set(enrollments.map((enrollment) => enrollment.userId))];

    const [courses, completedProgress] = await Promise.all([
      this.prisma.course.findMany({
        where: {
          tenantId,
          id: { in: courseIds },
          deletedAt: null,
        },
        select: {
          id: true,
          lessons: {
            where: { deletedAt: null },
            select: { id: true },
          },
        },
      }),
      this.prisma.userLessonProgress.findMany({
        where: {
          tenantId,
          userId: { in: userIds },
          status: ProgressStatus.COMPLETED,
          lesson: {
            courseId: { in: courseIds },
            deletedAt: null,
          },
        },
        select: {
          userId: true,
          lesson: {
            select: {
              courseId: true,
            },
          },
        },
      }),
    ]);

    const lessonCountByCourse = new Map(
      courses.map((course) => [course.id, course.lessons.length]),
    );
    const completedByEnrollment = new Map<string, number>();

    for (const record of completedProgress) {
      const key = `${record.userId}:${record.lesson.courseId}`;
      completedByEnrollment.set(key, (completedByEnrollment.get(key) ?? 0) + 1);
    }

    const completedEnrollments = enrollments.filter((enrollment) => {
      const totalLessons = lessonCountByCourse.get(enrollment.courseId) ?? 0;
      if (totalLessons === 0) {
        return false;
      }

      const completedLessons =
        completedByEnrollment.get(`${enrollment.userId}:${enrollment.courseId}`) ?? 0;

      return completedLessons >= totalLessons;
    }).length;

    return Math.round((completedEnrollments / enrollments.length) * 100);
  }
}
