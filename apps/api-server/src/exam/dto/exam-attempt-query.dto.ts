import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ExamAttemptQueryDto {
  @ApiPropertyOptional({ description: 'Filter exam attempts by course ID' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter exam attempts by exam ID' })
  @IsUUID()
  @IsOptional()
  examId?: string;

  @ApiPropertyOptional({
    description: 'Limit returned attempts',
    default: 10,
    minimum: 1,
    maximum: 20,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
