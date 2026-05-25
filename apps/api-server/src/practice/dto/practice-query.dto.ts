import { ApiPropertyOptional } from '@nestjs/swagger';
import { PracticeQuestionType } from '@repo/database';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PRACTICE_SKILL_FILTER_PATTERN = /^[A-Z][A-Z0-9_]*(,[A-Z][A-Z0-9_]*)*$/;
export const PRACTICE_SET_STATUS_FILTERS = ['all', 'published', 'draft'] as const;
export type PracticeSetStatusFilter = (typeof PRACTICE_SET_STATUS_FILTERS)[number];

export class PracticeQueryDto {
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

  @ApiPropertyOptional({ description: 'Filter by course ID' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({
    description: 'Filter by skill code(s). Comma-separated list, e.g. VOCABULARY,GRAMMAR',
  })
  @IsString()
  @MaxLength(256)
  @Matches(PRACTICE_SKILL_FILTER_PATTERN, {
    message:
      'skill must be uppercase codes (letters/digits/underscore), comma-separated, starting with a letter',
  })
  @IsOptional()
  skill?: string;

  @ApiPropertyOptional({ description: 'Search by prompt, title, description, or unit title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: PracticeQuestionType, description: 'Filter by question type' })
  @IsOptional()
  @IsEnum(PracticeQuestionType)
  questionType?: PracticeQuestionType;

  @ApiPropertyOptional({
    enum: PRACTICE_SET_STATUS_FILTERS,
    default: 'all',
    description: 'Filter exercise sets by publish status',
  })
  @IsOptional()
  @IsIn(PRACTICE_SET_STATUS_FILTERS)
  status?: PracticeSetStatusFilter = 'all';
}
