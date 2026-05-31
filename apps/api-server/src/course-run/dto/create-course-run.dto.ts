import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseRunStatus } from '@repo/database';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseRunDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;

  @ApiProperty()
  @IsUUID()
  instructorId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  cohortId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(48)
  code?: string;

  @ApiPropertyOptional({ enum: CourseRunStatus })
  @IsEnum(CourseRunStatus)
  @IsOptional()
  status?: CourseRunStatus;

  @ApiPropertyOptional({ minimum: 1, maximum: 500 })
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  enrollmentOpensAt?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  enrollmentClosesAt?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  timezone?: string;

  @ApiPropertyOptional({ example: 'online' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  deliveryMode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional()
  @IsUrl({ require_tld: false })
  @IsOptional()
  @MaxLength(500)
  onlineMeetingUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
