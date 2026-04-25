import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    tenantId: string;
    slug?: string;
    description?: string;
    totalDuration?: number;
  }) {
    return this.prisma.course.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        totalDuration: data.totalDuration,
        tenantId: data.tenantId,
      },
    });
  }

  async findAll(
    tenantId: string,
    options: { page?: number; limit?: number; search?: string } = {},
  ) {
    const { page = 1, limit = 10, search } = options;
    const skip = (page - 1) * limit;

    const where = { tenantId, deletedAt: null, isActive: true };
    if (search) {
      Object.assign(where, { title: { contains: search, mode: 'insensitive' as const } });
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              lessons: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, tenantId, deletedAt: null, isActive: true },
      include: {
        lessons: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found in this tenant`);
    return course;
  }

  async update(
    id: string,
    tenantId: string,
    data: { title?: string; slug?: string; description?: string; totalDuration?: number },
  ) {
    // Ensure course exists and belongs to tenant
    await this.findOne(id, tenantId);

    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    // Ensure course exists and belongs to tenant
    await this.findOne(id, tenantId);

    return this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
