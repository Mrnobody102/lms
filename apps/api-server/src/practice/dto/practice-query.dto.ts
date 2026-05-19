import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class PracticeQueryDto {
  @ApiPropertyOptional({ description: 'Filter by course ID' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by course unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Filter by skill code (e.g. VOCABULARY)' })
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'skill must be uppercase letters/digits/underscore, starting with a letter',
  })
  @IsOptional()
  skill?: string;
}
