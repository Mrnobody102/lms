import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, IsUUID } from "class-validator";

export class CreateLessonDto {
  @ApiProperty({ example: "Introduction to NestJS", description: "Lesson title" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: "Lesson content here...", description: "Lesson content" })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: "https://youtube.com/...", description: "Video URL" })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 1, description: "Lesson order" })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiProperty({ example: "uuid-of-course", description: "Course ID" })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({ example: "video", enum: ["video", "text", "quiz"], description: "Lesson type" })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 10, description: "Duration in minutes" })
  @IsInt()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: "Quiz data" })
  @IsOptional()
  quiz?: any;
}
