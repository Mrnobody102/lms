import { ApiPropertyOptional } from '@nestjs/swagger';
import { PracticeQuestionType } from '@repo/database';
import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ANSWER_LIMITS } from '../../common/utils/answer-validation.util';

export class UpdateAiQuestionDraftDto {
  @ApiPropertyOptional({ enum: PracticeQuestionType })
  @IsEnum(PracticeQuestionType)
  @IsOptional()
  type?: PracticeQuestionType;

  @ApiPropertyOptional({ description: 'Question prompt' })
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  prompt?: string;

  @ApiPropertyOptional({ description: 'Question options payload' })
  @IsOptional()
  options?: unknown;

  @ApiPropertyOptional({ description: 'Correct answer payload' })
  @IsOptional()
  correctAnswer?: unknown;

  @ApiPropertyOptional({ description: 'Explanation shown after scoring' })
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  explanation?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'Skill tags' })
  @IsArray()
  @ArrayMaxSize(ANSWER_LIMITS.maxSkillTags)
  @IsString({ each: true })
  @IsOptional()
  skillTags?: string[];

  @ApiPropertyOptional({ description: 'Difficulty label from the provider or reviewer' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  difficulty?: string | null;
}
