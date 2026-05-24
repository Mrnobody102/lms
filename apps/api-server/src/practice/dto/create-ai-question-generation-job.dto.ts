import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PracticeQuestionType } from '@repo/database';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ANSWER_LIMITS } from '../../common/utils/answer-validation.util';

export class CreateAiQuestionGenerationJobDto {
  @ApiProperty({ description: 'Course to associate generated drafts with' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({ description: 'Unit within the course' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiProperty({ description: 'Topic or prompt for generating questions' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  topic: string;

  @ApiPropertyOptional({ description: 'Reference context or lesson content' })
  @IsString()
  @IsOptional()
  @MaxLength(20000)
  context?: string;

  @ApiProperty({ description: 'Number of questions to generate', minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  count: number;

  @ApiProperty({ enum: PracticeQuestionType })
  @IsEnum(PracticeQuestionType)
  questionType: PracticeQuestionType;

  @ApiPropertyOptional({ type: [String], description: 'Target skill tags' })
  @IsArray()
  @ArrayMaxSize(ANSWER_LIMITS.maxSkillTags)
  @IsString({ each: true })
  @IsOptional()
  skillTags?: string[];

  @ApiPropertyOptional({ description: 'Reason or source for generation, e.g. cold-start' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  sourceReason?: string;
}
