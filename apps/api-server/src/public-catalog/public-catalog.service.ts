import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { PublicCourseQueryDto } from './dto/public-course-query.dto';

interface PublicLessonPreview {
  id: string;
  title: string;
  type: string;
  duration: number;
  order: number;
}

interface PublicCourseUnitPreview {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: PublicLessonPreview[];
}

interface PublicCourseLevel {
  id: string;
  title: string;
  program: {
    id: string;
    title: string;
  } | null;
}

export interface PublicCourseSummary {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  coverImageUrl: string | null;
  languageCode: string | null;
  proficiencyLevel: string | null;
  totalDuration: number;
  level: PublicCourseLevel | null;
  lessonCount: number;
  unitCount: number;
}

export interface PublicCourseDetail extends PublicCourseSummary {
  units: PublicCourseUnitPreview[];
  ungroupedLessons: PublicLessonPreview[];
}

export interface PublicCourseListResponse {
  data: PublicCourseSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const publicCourseSummarySelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImageUrl: true,
  languageCode: true,
  proficiencyLevel: true,
  totalDuration: true,
  level: {
    select: {
      id: true,
      title: true,
      program: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
  _count: {
    select: {
      lessons: {
        where: { deletedAt: null },
      },
      units: {
        where: { deletedAt: null },
      },
    },
  },
} satisfies Prisma.CourseSelect;

const publicLessonPreviewSelect = {
  id: true,
  title: true,
  type: true,
  duration: true,
  order: true,
} satisfies Prisma.LessonSelect;

const publicCourseDetailSelect = {
  ...publicCourseSummarySelect,
  units: {
    where: { deletedAt: null },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      title: true,
      description: true,
      order: true,
      lessons: {
        where: { deletedAt: null },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        select: publicLessonPreviewSelect,
      },
    },
  },
  lessons: {
    where: { deletedAt: null, unitId: null },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: publicLessonPreviewSelect,
  },
} satisfies Prisma.CourseSelect;

type PublicCourseSummaryRow = Prisma.CourseGetPayload<{
  select: typeof publicCourseSummarySelect;
}>;

type PublicCourseDetailRow = Prisma.CourseGetPayload<{
  select: typeof publicCourseDetailSelect;
}>;

@Injectable()
export class PublicCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCourses(
    tenantId: string,
    query: PublicCourseQueryDto = {},
  ): Promise<PublicCourseListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const where: Prisma.CourseWhereInput = {
      tenantId,
      isActive: true,
      deletedAt: null,
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      ...(query.languageCode ? { languageCode: query.languageCode } : {}),
      ...(query.proficiencyLevel ? { proficiencyLevel: query.proficiencyLevel } : {}),
      ...(query.programId ? { level: { programId: query.programId } } : {}),
    };

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        select: publicCourseSummarySelect,
        orderBy: [{ createdAt: 'desc' }, { title: 'asc' }],
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses.map(mapPublicCourseSummary),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getCourse(courseId: string, tenantId: string): Promise<PublicCourseDetail> {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: publicCourseDetailSelect,
    });

    if (!course) {
      throw new NotFoundException('Published course not found');
    }

    return mapPublicCourseDetail(course);
  }
}

function mapPublicCourseSummary(course: PublicCourseSummaryRow): PublicCourseSummary {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    coverImageUrl: course.coverImageUrl,
    languageCode: course.languageCode,
    proficiencyLevel: course.proficiencyLevel,
    totalDuration: course.totalDuration,
    level: course.level,
    lessonCount: course._count.lessons,
    unitCount: course._count.units,
  };
}

function mapPublicCourseDetail(course: PublicCourseDetailRow): PublicCourseDetail {
  return {
    ...mapPublicCourseSummary(course),
    units: course.units,
    ungroupedLessons: course.lessons,
  };
}
