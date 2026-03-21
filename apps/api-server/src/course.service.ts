import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./common/services/prisma.service";

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { title: string; tenantId: string; slug?: string; totalDuration?: number }) {
    return this.prisma.course.create({
      data: {
        title: data.title,
        slug: data.slug,
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

    const where = { tenantId };
    if (search) {
      Object.assign(where, { title: { contains: search, mode: "insensitive" as const } });
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { lessons: true },
          },
        },
        orderBy: { createdAt: "desc" },
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
      where: { id, tenantId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });
    if (!course)
      throw new NotFoundException(
        `Course with ID ${id} not found in this tenant`,
      );
    return course;
  }

  async update(id: string, tenantId: string, data: { title?: string; slug?: string; totalDuration?: number }) {
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

    return this.prisma.course.delete({ where: { id } });
  }
}
