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

  @ApiPropertyOptional({
    description: 'Filter by skill code(s). Comma-separated list, e.g. VOCABULARY,GRAMMAR',
  })
  @IsString()
  @MaxLength(256)
  @Matches(/^[A-Z][A-Z0-9_]*(,[A-Z][A-Z0-9_]*)*$/, {
    message:
      'skill must be uppercase codes (letters/digits/underscore), comma-separated, starting with a letter',
  })
  @IsOptional()
  skill?: string;
}
