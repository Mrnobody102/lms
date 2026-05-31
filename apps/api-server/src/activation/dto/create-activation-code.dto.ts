import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateActivationCodeDto {
  @ApiProperty({ description: 'The unique activation code string' })
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Activation code must use uppercase letters, numbers, or hyphens',
  })
  code: string;

  @ApiPropertyOptional({ description: 'Description of what this code unlocks' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Maximum number of times this code can be used', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
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
