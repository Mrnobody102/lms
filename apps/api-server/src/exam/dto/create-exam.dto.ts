import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExamQuestionType } from '@repo/database';

export class CreateExamQuestionDto {
  @ApiProperty({ enum: ExamQuestionType })
  @IsEnum(ExamQuestionType)
  type: ExamQuestionType;

  @ApiProperty({ description: 'Question prompt' })
  @IsString()
  @MaxLength(5000)
  prompt: string;

  @ApiPropertyOptional({ description: 'Question options for multiple choice questions' })
  @IsOptional()
  options?: unknown;

  @ApiProperty({ description: 'Correct answer payload. Number for MCQ, string for fill blank.' })
  @IsDefined()
  correctAnswer: unknown;

  @ApiPropertyOptional({ description: 'Explanation shown after grading' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  explanation?: string;

  @ApiPropertyOptional({ description: 'Question point value', default: 1 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ type: [String], description: 'Skill tags such as vocabulary/grammar' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skillTags?: string[];
}

export class CreateExamSectionDto {
  @ApiProperty({ description: 'Section title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Section order' })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiProperty({ type: [CreateExamQuestionDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateExamQuestionDto)
  questions: CreateExamQuestionDto[];
}

export class CreateExamDto {
  @ApiProperty({ description: 'Course ID that owns this exam' })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({ description: 'Optional course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiProperty({ description: 'Exam title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Exam description' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

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
  passingScore?: number;

  @ApiPropertyOptional({ description: 'Whether students can see and take this exam' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ type: [CreateExamSectionDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateExamSectionDto)
  sections: CreateExamSectionDto[];
}
