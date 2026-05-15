import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProgramDto {
  @ApiProperty({ description: 'The title of the program' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'The slug for URL' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'The description of the program' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the program is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
