import { ApiPropertyOptional } from '@nestjs/swagger';
import { PracticeQuestionType } from '@repo/database';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ANSWER_LIMITS } from '../../common/utils/answer-validation.util';

export class UpdatePracticeQuestionDto {
  @ApiPropertyOptional({ description: 'Optional course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string | null;

  @ApiPropertyOptional({ enum: PracticeQuestionType })
  @IsEnum(PracticeQuestionType)
  @IsOptional()
  type?: PracticeQuestionType;

  @ApiPropertyOptional({ description: 'Question prompt' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  prompt?: string;

  @ApiPropertyOptional({ description: 'Question options for multiple choice questions' })
  @IsOptional()
  options?: unknown;

  @ApiPropertyOptional({
    description:
      'Correct answer payload. Number for MCQ, string for fill blank or AI reference answer.',
  })
  @IsOptional()
  correctAnswer?: unknown;

  @ApiPropertyOptional({ description: 'Explanation shown after scoring' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  explanation?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'Skill tags such as vocabulary/grammar' })
  @IsArray()
  @ArrayMaxSize(ANSWER_LIMITS.maxSkillTags)
  @IsString({ each: true })
  @IsOptional()
  skillTags?: string[];
}
