import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  MaxLength,
  IsEnum,
  IsUrl,
  Min,
  IsObject,
} from 'class-validator';
import { LessonType } from '@repo/database';

export class CreateLessonDto {
  @ApiProperty({ example: 'Introduction to NestJS', description: 'Lesson title' })
  @IsString()
  @MaxLength(255, { message: 'Lesson title must be at most 255 characters' })
  title: string;

  @ApiPropertyOptional({ example: 'Lesson content here...', description: 'Lesson content' })
  @IsString()
  @IsOptional()
  @MaxLength(50000, { message: 'Lesson content must be at most 50000 characters' })
  content?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/...', description: 'Video URL' })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Video URL must be at most 2000 characters' })
  @IsUrl({ require_protocol: true })
  videoUrl?: string;

  @ApiPropertyOptional({ example: 1, description: 'Lesson order' })
  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @ApiProperty({ example: 'uuid-of-course', description: 'Course ID' })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({ example: 'video', description: 'Lesson type' })
  @IsEnum(LessonType, { message: 'Type must be one of: video, text, quiz' })
  @IsOptional()
  type?: LessonType;

  @ApiPropertyOptional({ example: 10, description: 'Duration in minutes' })
  @IsInt()
  @IsOptional()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: 'Quiz data' })
  @IsOptional()
  @IsObject()
  quiz?: object;
}
