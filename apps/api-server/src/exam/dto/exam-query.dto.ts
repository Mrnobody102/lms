import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class ExamQueryDto {
  @ApiPropertyOptional({ description: 'Filter exams by course ID' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter exams by course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string;
}
