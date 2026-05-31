import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PublicCourseQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 12, default: 12, description: 'Items per page' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 12;

  @ApiPropertyOptional({ description: 'Search published courses by title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by course language code' })
  @IsOptional()
  @IsString()
  languageCode?: string;

  @ApiPropertyOptional({ description: 'Filter by proficiency level label/code' })
  @IsOptional()
  @IsString()
  proficiencyLevel?: string;

  @ApiPropertyOptional({ description: 'Filter by program ID' })
  @IsOptional()
  @IsString()
  programId?: string;
}
