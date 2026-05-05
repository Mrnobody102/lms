import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ANSWER_LIMITS } from '../../common/utils/answer-validation.util';

export class SubmitExamAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: 'Submitted answer payload' })
  @IsDefined()
  answer: unknown;
}

export class SubmitExamAttemptDto {
  @ApiProperty({ type: [SubmitExamAnswerDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(ANSWER_LIMITS.maxSubmittedAnswers)
  @ValidateNested({ each: true })
  @Type(() => SubmitExamAnswerDto)
  answers: SubmitExamAnswerDto[];
}
