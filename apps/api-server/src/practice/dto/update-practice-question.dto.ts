import { ApiPropertyOptional } from '@nestjs/swagger';
import { PracticeQuestionType } from '@repo/database';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
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

  @ApiPropertyOptional({ description: 'MediaAsset ID for audio prompt; null clears audio' })
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  @IsOptional()
  audioMediaAssetId?: string | null;

  @ApiPropertyOptional({
    description: 'Maximum replay count; null = unlimited',
    minimum: 1,
    maximum: 20,
  })
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  audioReplayLimit?: number | null;
}
