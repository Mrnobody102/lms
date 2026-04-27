import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  MaxLength,
  IsEnum,
  IsUrl,
  Min,
  IsObject,
  IsUUID,
} from 'class-validator';
import { LessonType } from '@repo/database';

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 'Updated lesson title', description: 'Lesson title' })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Lesson title must be at most 255 characters' })
  title?: string;

  @ApiPropertyOptional({ description: 'Lesson content' })
  @IsString()
  @IsOptional()
  @MaxLength(50000, { message: 'Lesson content must be at most 50000 characters' })
  content?: string;

  @ApiPropertyOptional({ description: 'Video URL' })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Video URL must be at most 2000 characters' })
  @IsUrl({ require_protocol: true })
  videoUrl?: string;

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
  @IsEnum(LessonType, { message: 'Type must be one of: video, text, quiz' })
  @IsOptional()
  type?: LessonType;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsInt()
  @IsOptional()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: 'Quiz data' })
  @IsOptional()
  @IsObject()
  quiz?: object;
}
