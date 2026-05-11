import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateExamSectionDto } from './create-exam.dto';
import { ANSWER_LIMITS } from '../../common/utils/answer-validation.util';

export class UpdateExamDto {
  @ApiPropertyOptional({ description: 'Optional course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string | null;

  @ApiPropertyOptional({ description: 'Exam title' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Exam description' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ description: 'Duration in minutes', default: 30 })
  @IsInt()
  @Min(1)
  @Max(600)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Passing score as percentage from 0 to 100' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  passingScore?: number | null;

  @ApiPropertyOptional({ description: 'Whether students can see and take this exam' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [CreateExamSectionDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(ANSWER_LIMITS.maxExamSections)
  @ValidateNested({ each: true })
  @Type(() => CreateExamSectionDto)
  @IsOptional()
  sections?: CreateExamSectionDto[];
}
