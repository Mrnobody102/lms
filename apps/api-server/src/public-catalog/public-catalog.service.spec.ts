import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PublicCatalogService } from './public-catalog.service';

const courseSummaryRow = {
  id: 'course-1',
  title: 'IELTS Foundations',
  slug: 'ielts-foundations',
  description: 'Build core IELTS skills.',
  coverImageUrl: 'https://cdn.example.com/course.jpg',
  totalDuration: 90,
  level: {
    id: 'level-1',
    title: 'Foundation',
    program: { id: 'program-1', title: 'IELTS' },
  },
  _count: {
    lessons: 8,
    units: 2,
  },
};

describe('PublicCatalogService', () => {
  it('should list only published tenant courses with public-safe fields', async () => {
    const prisma = {
      course: {
        findMany: vi.fn().mockResolvedValue([courseSummaryRow]),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    const service = new PublicCatalogService(prisma as never);

    await expect(
      service.listCourses('tenant-1', { page: 1, limit: 12, search: 'IELTS' }),
    ).resolves.toEqual({
      data: [
        {
          id: 'course-1',
          title: 'IELTS Foundations',
          slug: 'ielts-foundations',
          description: 'Build core IELTS skills.',
          coverImageUrl: 'https://cdn.example.com/course.jpg',
          totalDuration: 90,
          level: courseSummaryRow.level,
          lessonCount: 8,
          unitCount: 2,
        },
      ],
      meta: {
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
      },
    });
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          isActive: true,
          deletedAt: null,
          title: { contains: 'IELTS', mode: 'insensitive' },
        },
      }),
    );
    expect(prisma.course.findMany.mock.calls[0]?.[0].select.lessons).toBeUndefined();
    expect(prisma.course.findMany.mock.calls[0]?.[0].select.enrollments).toBeUndefined();
  });

  it('should return a public course detail without private lesson content', async () => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({
          ...courseSummaryRow,
          units: [
            {
              id: 'unit-1',
              title: 'Getting Started',
              description: null,
              order: 1,
              lessons: [
                {
                  id: 'lesson-1',
                  title: 'Introduction',
                  type: 'video',
                  duration: 10,
                  order: 1,
                },
              ],
            },
          ],
          lessons: [],
        }),
      },
    };
    const service = new PublicCatalogService(prisma as never);

    const result = await service.getCourse('course-1', 'tenant-1');

    expect(result.units[0]?.lessons[0]).toEqual({
      id: 'lesson-1',
      title: 'Introduction',
      type: 'video',
      duration: 10,
      order: 1,
    });
    expect(prisma.course.findFirst.mock.calls[0]?.[0].select.units.select.lessons.select).toEqual(
      expect.not.objectContaining({
        content: true,
        videoUrl: true,
        aiPrompt: true,
      }),
    );
  });

  it('should throw NotFoundException when the course is not publicly visible', async () => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const service = new PublicCatalogService(prisma as never);

    await expect(service.getCourse('course-1', 'tenant-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.course.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'course-1',
          tenantId: 'tenant-1',
          isActive: true,
          deletedAt: null,
        },
      }),
    );
  });
});
