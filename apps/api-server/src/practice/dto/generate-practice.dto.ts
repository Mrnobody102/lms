import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PracticeQuestionType } from '@repo/database';

export class GeneratePracticeDto {
  @ApiProperty({ description: 'Course to associate generated questions with' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({ description: 'Unit within the course (optional)' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiProperty({ description: 'The topic or prompt for generating questions' })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiPropertyOptional({ description: 'Reference context or lesson content' })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiProperty({ description: 'Number of questions to generate', minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  count: number;

  @ApiProperty({ enum: PracticeQuestionType })
  @IsEnum(PracticeQuestionType)
  questionType: PracticeQuestionType;

  @ApiPropertyOptional({ description: 'Target skill tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skillTags?: string[];
}
