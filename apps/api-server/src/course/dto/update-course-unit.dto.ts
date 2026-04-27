import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCourseUnitDto {
  @ApiPropertyOptional({ example: 'Unit 1: Updated title', description: 'Unit title' })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Unit title must be at most 255 characters' })
  title?: string;

  @ApiPropertyOptional({ description: 'Unit description' })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Unit description must be at most 2000 characters' })
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'Unit order inside the course' })
  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}
