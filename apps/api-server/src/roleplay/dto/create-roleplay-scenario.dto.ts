import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleplayMode } from '@repo/database';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateRoleplayScenarioDto {
  @ApiProperty({ example: 'Ordering coffee' })
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiPropertyOptional({ example: 'Practice a short cafe conversation.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'course-uuid' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ example: 'unit-uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ example: 'en-US', default: 'en-US' })
  @IsOptional()
  @IsString()
  targetLanguage?: string;

  @ApiPropertyOptional({ example: 'Beginner' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ example: ['speaking', 'vocabulary'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillTags?: string[];

  @ApiPropertyOptional({ enum: RoleplayMode, default: RoleplayMode.TEXT })
  @IsOptional()
  @IsEnum(RoleplayMode)
  mode?: RoleplayMode;

  @ApiProperty({ example: 'You are a patient cafe barista. Keep replies short.' })
  @IsString()
  @MaxLength(4000)
  systemPrompt: string;

  @ApiPropertyOptional({ example: 'Hello, what would you like to order?' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  openingMessage?: string;

  @ApiPropertyOptional({ example: { grammar: 40, vocabulary: 30, fluency: 30 } })
  @IsOptional()
  @IsObject()
  rubric?: Record<string, unknown>;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
