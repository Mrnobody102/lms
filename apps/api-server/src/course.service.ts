import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./common/services/prisma.service";

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { title: string; tenantId: string }) {
    return this.prisma.course.create({
      data: {
        title: data.title,
        tenantId: data.tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.course.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });
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

  async update(id: string, tenantId: string, data: { title?: string }) {
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
