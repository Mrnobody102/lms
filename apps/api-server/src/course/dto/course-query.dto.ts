import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export const COURSE_STATUS_FILTERS = ['all', 'published', 'draft'] as const;
export type CourseStatusFilter = (typeof COURSE_STATUS_FILTERS)[number];

export class CourseQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Items per page' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: COURSE_STATUS_FILTERS,
    default: 'all',
    description: 'Filter courses by publish status',
  })
  @IsOptional()
  @IsIn(COURSE_STATUS_FILTERS)
  status?: CourseStatusFilter = 'all';
}
