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
  }) {
    return this.prisma.course.update({
      where: { id: data.courseId },
      data: {
        lessons: {
          create: {
            title: data.title,
            type: (data.type as any) || "text",
            content: data.content,
            videoUrl: data.videoUrl,
            duration: data.duration || 10,
            quiz: data.quiz ? data.quiz : undefined,
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
      type?: string;
      content?: string;
      videoUrl?: string;
      duration?: number;
      quiz?: any;
      order?: number;
    },
  ) {
    // Convert type string to enum if present
    const updateData: any = { ...data };
    if (updateData.quiz === null) {
      updateData.quiz = undefined; // Prisma requires Prisma.JsonNull for explicit null, keeping undefined skips update
    }

    return this.prisma.lesson.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }
}
