import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./common/services/prisma.service";

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    type?: string;
    content?: string;
    videoUrl?: string;
    duration?: number;
    quiz?: any;
    order?: number;
    courseId: string;
    tenantId: string;
  }) {
    // Ensure course belongs to tenant
    const course = await this.prisma.course.findFirst({
      where: { id: data.courseId, tenantId: data.tenantId },
    });
    if (!course)
      throw new NotFoundException(
        `Course with ID ${data.courseId} not found in this tenant`,
      );

    return this.prisma.lesson.create({
      data: {
        title: data.title,
        type: (data.type as any) || "text",
        content: data.content,
        videoUrl: data.videoUrl,
        duration: data.duration || 10,
        quiz: data.quiz ? data.quiz : undefined,
        order: data.order || 0,
        courseId: data.courseId,
        tenantId: data.tenantId,
      },
    });
  }

  async findAll(courseId: string, tenantId: string) {
    return this.prisma.lesson.findMany({
      where: { courseId, tenantId },
      orderBy: { order: "asc" },
    });
  }

  async findOne(id: string, tenantId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, tenantId },
    });
    if (!lesson)
      throw new NotFoundException(
        `Lesson with ID ${id} not found in this tenant`,
      );
    return lesson;
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      title?: string;
      type?: string;
      content?: string;
      videoUrl?: string;
      duration?: number;
      quiz?: any;
      order?: number;
    },
  ) {
    // Ensure lesson exists and belongs to tenant
    await this.findOne(id, tenantId);

    const updateData: any = { ...data };
    if (updateData.quiz === null) {
      updateData.quiz = undefined;
    }

    return this.prisma.lesson.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, tenantId: string) {
    // Ensure lesson exists and belongs to tenant
    await this.findOne(id, tenantId);

    return this.prisma.lesson.delete({ where: { id } });
  }
}
