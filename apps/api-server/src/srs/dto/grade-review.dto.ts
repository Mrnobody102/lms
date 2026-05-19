import { ApiProperty } from '@nestjs/swagger';
import { ReviewCardGrade } from '@repo/database';
import { IsEnum } from 'class-validator';

export class GradeReviewDto {
  @ApiProperty({ enum: ReviewCardGrade, description: 'SM-2 quality grade' })
  @IsEnum(ReviewCardGrade)
  grade!: ReviewCardGrade;
}
