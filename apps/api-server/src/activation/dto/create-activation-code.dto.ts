import { IsString, IsOptional, IsInt, Min, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivationCodeDto {
  @ApiProperty({ description: 'The unique activation code string' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Description of what this code unlocks' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Maximum number of times this code can be used', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Expiration date of the code' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Specific course this code unlocks' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Whether the code is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
