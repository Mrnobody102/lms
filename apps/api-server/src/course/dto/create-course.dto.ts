import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, MaxLength } from "class-validator";

export class CreateCourseDto {
  @ApiProperty({ example: "Lập trình Next.js cơ bản", description: "Course title" })
  @IsString()
  @MaxLength(255, { message: "Course title must be at most 255 characters" })
  title: string;

  @ApiPropertyOptional({ example: "khoa-hoc-nextjs", description: "SEO-friendly slug (unique per tenant)" })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: "Slug must be at most 255 characters" })
  slug?: string;

  @ApiPropertyOptional({ example: "Khóa học lập trình web...", description: "Course description" })
  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: "Description must be at most 5000 characters" })
  description?: string;

  @ApiPropertyOptional({ example: 30, description: "Total duration in minutes" })
  @IsInt()
  @IsOptional()
  totalDuration?: number;
}
