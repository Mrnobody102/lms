import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDefined, IsUUID, ValidateNested } from 'class-validator';

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
  @ValidateNested({ each: true })
  @Type(() => SubmitExamAnswerDto)
  answers: SubmitExamAnswerDto[];
}
