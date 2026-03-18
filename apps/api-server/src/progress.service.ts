import { Injectable } from "@nestjs/common";
import { PrismaClient, ProgressStatus } from "@repo/database";

const prisma = new PrismaClient();

@Injectable()
export class ProgressService {
  /**
   * Update or create a progress record for a user and lesson.
   * Prisma will automatically validate that the user and lesson exist due to foreign key constraints.
   */
  async updateProgress(
    userId: string,
    lessonId: string,
    status: ProgressStatus,
  ) {
    return prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        status,
      },
      create: {
        userId,
        lessonId,
        status,
      },
    });
  }

  /**
   * Get all progress records for a user within a specific course.
   */
  async getProgress(userId: string, courseId: string) {
    return prisma.userLessonProgress.findMany({
      where: {
        userId,
        lesson: {
          courseId,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  /**
   * Get a single progress record for a user and lesson.
   */
  async getLessonProgress(userId: string, lessonId: string) {
    return prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });
  }
}
