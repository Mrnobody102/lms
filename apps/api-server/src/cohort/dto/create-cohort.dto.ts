import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCohortDto {
  @ApiProperty({ example: 'HSK 1 Evening Class', description: 'Cohort display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Students enrolled in the evening HSK 1 cohort' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether this cohort can be used' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
