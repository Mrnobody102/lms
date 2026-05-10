import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PracticeQuestionType } from '@repo/database';
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { ANSWER_LIMITS } from '../../common/utils/answer-validation.util';

export class CreatePracticeQuestionDto {
  @ApiProperty({ description: 'Course ID that owns this question' })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({ description: 'Optional course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiProperty({ enum: PracticeQuestionType })
  @IsEnum(PracticeQuestionType)
  type: PracticeQuestionType;

  @ApiProperty({ description: 'Question prompt' })
  @IsString()
  @MaxLength(5000)
  prompt: string;

  @ApiPropertyOptional({ description: 'Question options for multiple choice questions' })
  @IsOptional()
  options?: unknown;

  @ApiProperty({
    description:
      'Correct answer payload. Number for MCQ, string for fill blank or AI reference answer.',
  })
  @IsDefined()
  correctAnswer: unknown;

  @ApiPropertyOptional({ description: 'Explanation shown after scoring' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  explanation?: string;

  @ApiPropertyOptional({ type: [String], description: 'Skill tags such as vocabulary/grammar' })
  @IsArray()
  @ArrayMaxSize(ANSWER_LIMITS.maxSkillTags)
  @IsString({ each: true })
  @IsOptional()
  skillTags?: string[];
}
