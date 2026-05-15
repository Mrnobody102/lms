import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Matches, MaxLength, IsObject, IsUUID } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Lập trình Next.js cơ bản', description: 'Course title' })
  @IsString()
  @MaxLength(255, { message: 'Course title must be at most 255 characters' })
  title: string;

  @ApiPropertyOptional({
    example: 'khoa-hoc-nextjs',
    description: 'SEO-friendly slug (unique per tenant)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Slug must be at most 255 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain lowercase letters, numbers, and single hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'Khóa học lập trình web...', description: 'Course description' })
  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'Description must be at most 5000 characters' })
  description?: string;

  @ApiPropertyOptional({ example: 30, description: 'Total duration in minutes' })
  @IsInt()
  @IsOptional()
  totalDuration?: number;

  @ApiPropertyOptional({
    description: 'Temporary AI settings stored per course until provider integration is ready',
    type: Object,
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  aiSettings?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'The level this course belongs to' })
  @IsOptional()
  @IsUUID()
  levelId?: string;
}
