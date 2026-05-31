import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsObject,
  IsUUID,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Tiếng Anh giao tiếp cơ bản', description: 'Course title' })
  @IsString()
  @MinLength(2, { message: 'Course title must be at least 2 characters' })
  @MaxLength(255, { message: 'Course title must be at most 255 characters' })
  title: string;

  @ApiPropertyOptional({
    example: 'tieng-anh-giao-tiep-co-ban',
    description: 'SEO-friendly slug (unique per tenant)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Slug must be at most 255 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain lowercase letters, numbers, and single hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({
    example: 'Khóa học luyện giao tiếp theo tình huống...',
    description: 'Course description',
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'Description must be at most 5000 characters' })
  description?: string;

  @ApiPropertyOptional({ example: 30, description: 'Total duration in minutes' })
  @IsInt()
  @IsOptional()
  @Min(0, { message: 'Total duration must not be negative' })
  @Max(100000, { message: 'Total duration must be at most 100000 minutes' })
  totalDuration?: number;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/course-cover.jpg',
    description: 'URL of the course cover/thumbnail image',
  })
  @IsUrl({}, { message: 'coverImageUrl must be a valid URL' })
  @IsOptional()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'language', description: 'Course domain or subject' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  subject?: string;

  @ApiPropertyOptional({
    example: 'ja',
    description: 'ISO-like language code for language courses',
  })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  languageCode?: string;

  @ApiPropertyOptional({
    example: 'JLPT N4',
    description: 'External or internal proficiency level',
  })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  proficiencyLevel?: string;

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

  @ApiPropertyOptional({
    description: 'Whether the course is visible/published to students',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
