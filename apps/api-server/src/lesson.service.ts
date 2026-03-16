import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./common/services/prisma.service";

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    content?: string;
    videoUrl?: string;
    order?: number;
    courseId: string;
  }) {
    return this.prisma.course.update({
      where: { id: data.courseId },
      data: {
        lessons: {
          create: {
            title: data.title,
            content: data.content,
            videoUrl: data.videoUrl,
            order: data.order || 0,
          },
        },
      },
      include: { lessons: true },
    });
  }

  async findAll(courseId: string) {
    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException(`Lesson with ID ${id} not found`);
    return lesson;
  }

  async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      videoUrl?: string;
      order?: number;
    },
  ) {
    return this.prisma.lesson.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }
}
