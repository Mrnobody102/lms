import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class PracticeQueryDto {
  @ApiPropertyOptional({ description: 'Filter by course ID' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string;
}
