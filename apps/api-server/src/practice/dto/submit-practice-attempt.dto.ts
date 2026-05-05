import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ANSWER_LIMITS } from '../../common/utils/answer-validation.util';

export class SubmitPracticeAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: 'Submitted answer payload' })
  @IsDefined()
  answer: unknown;
}

export class SubmitPracticeAttemptDto {
  @ApiProperty({ type: [SubmitPracticeAnswerDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(ANSWER_LIMITS.maxSubmittedAnswers)
  @ValidateNested({ each: true })
  @Type(() => SubmitPracticeAnswerDto)
  answers: SubmitPracticeAnswerDto[];
}
