import { Injectable, NotFoundException } from '@nestjs/common';
import { ProgressStatus } from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly _prisma: PrismaService) {}

  /**
   * Update or create a progress record for a user and lesson.
   * Ensures the lesson belongs to the user's tenant.
   */
  async updateProgress(userId: string, lessonId: string, status: ProgressStatus, tenantId: string) {
    // Verify lesson ownership
    const lesson = await this._prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
    });
    if (!lesson) throw new NotFoundException(`Lesson not found in this tenant`);

    return this._prisma.userLessonProgress.upsert({
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
        tenantId,
        status,
      },
    });
  }

  /**
   * Get all progress records for a user within a specific course.
   */
  async getProgress(userId: string, courseId: string, tenantId: string) {
    return this._prisma.userLessonProgress.findMany({
      where: {
        userId,
        lesson: {
          courseId,
          tenantId,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Get a single progress record for a user and lesson.
   */
  async getLessonProgress(userId: string, lessonId: string, tenantId: string) {
    const progress = await this._prisma.userLessonProgress.findFirst({
      where: {
        userId,
        lessonId,
        lesson: {
          tenantId,
        },
      },
    });

    if (!progress) {
      throw new NotFoundException(`Progress not found for lesson ${lessonId} and user ${userId}`);
    }

    return progress;
  }
}
