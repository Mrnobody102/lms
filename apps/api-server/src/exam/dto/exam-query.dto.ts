import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export const EXAM_STATUS_FILTERS = ['all', 'published', 'draft'] as const;
export type ExamStatusFilter = (typeof EXAM_STATUS_FILTERS)[number];

export class ExamQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Items per page' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter exams by course ID' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter exams by course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Search by title, description, or unit title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({
    enum: EXAM_STATUS_FILTERS,
    default: 'all',
    description: 'Filter exams by publish status',
  })
  @IsOptional()
  @IsIn(EXAM_STATUS_FILTERS)
  status?: ExamStatusFilter = 'all';
}
