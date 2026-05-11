import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ANSWER_LIMITS } from '../../common/utils/answer-validation.util';

export class UpdatePracticeSetDto {
  @ApiPropertyOptional({ description: 'Optional course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string | null;

  @ApiPropertyOptional({ description: 'Exercise set title' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Exercise set description' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ description: 'Whether students can see and submit this set' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Question IDs in set order' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(ANSWER_LIMITS.maxPracticeSetQuestions)
  @IsUUID(undefined, { each: true })
  @IsOptional()
  questionIds?: string[];
}
