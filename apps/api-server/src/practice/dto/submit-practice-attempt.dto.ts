import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDefined, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  @ValidateNested({ each: true })
  @Type(() => SubmitPracticeAnswerDto)
  answers: SubmitPracticeAnswerDto[];
}
