import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt } from "class-validator";

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: "Updated lesson title", description: "Lesson title" })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: "Lesson content" })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: "Video URL" })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ description: "Lesson order" })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ enum: ["video", "text", "quiz"], description: "Lesson type" })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: "Duration in minutes" })
  @IsInt()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: "Quiz data" })
  @IsOptional()
  quiz?: any;
}
