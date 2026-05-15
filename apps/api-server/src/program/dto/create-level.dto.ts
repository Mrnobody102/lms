import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLevelDto {
  @ApiProperty({ description: 'The title of the level' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'The description of the level' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'The display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Whether the level is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
