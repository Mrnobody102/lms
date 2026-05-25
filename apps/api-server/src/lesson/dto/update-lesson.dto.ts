import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  MaxLength,
  IsEnum,
  IsUrl,
  Min,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { LessonType } from '@repo/database';

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 'Updated lesson title', description: 'Lesson title' })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Lesson title must be at most 255 characters' })
  title?: string;

  @ApiPropertyOptional({ description: 'Lesson content' })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(50000, { message: 'Lesson content must be at most 50000 characters' })
  content?: string | null;

  @ApiPropertyOptional({ description: 'Video URL' })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(2000, { message: 'Video URL must be at most 2000 characters' })
  @IsUrl({ require_protocol: true })
  videoUrl?: string | null;

  @ApiPropertyOptional({ description: 'Lesson order' })
  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string | null;

  @ApiPropertyOptional({ description: 'Lesson type' })
  @IsEnum(LessonType, {
    message: 'Type must be one of: video, text, quiz, simulation, micro_card, practice, exam',
  })
  @IsOptional()
  type?: LessonType;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsInt()
  @IsOptional()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: 'Practice Exercise Set ID' })
  @IsUUID()
  @IsOptional()
  practiceExerciseSetId?: string | null;

  @ApiPropertyOptional({ description: 'Exam ID' })
  @IsUUID()
  @IsOptional()
  examId?: string | null;

  @ApiPropertyOptional({ description: 'AI prompt for simulation or micro-card lessons' })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(5000, { message: 'AI prompt must be at most 5000 characters' })
  aiPrompt?: string | null;
}
