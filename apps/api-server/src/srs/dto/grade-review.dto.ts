import { ApiProperty } from '@nestjs/swagger';
import { ReviewCardGrade } from '@repo/database';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class GradeReviewDto {
  @ApiProperty({ enum: ReviewCardGrade, description: 'SM-2 quality grade' })
  @IsEnum(ReviewCardGrade)
  grade!: ReviewCardGrade;

  @ApiProperty({ description: 'Time spent reviewing the card in milliseconds', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMs?: number;
}
