import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePlatformFeatureFlagsDto {
  @ApiPropertyOptional({ description: 'Enable AI tutor capabilities' })
  @IsBoolean()
  @IsOptional()
  aiTutorEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable activation/license code redemption' })
  @IsBoolean()
  @IsOptional()
  activationCodesEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable roleplay scenarios' })
  @IsBoolean()
  @IsOptional()
  roleplayEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable marketplace features' })
  @IsBoolean()
  @IsOptional()
  marketplaceEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable tenant billing features' })
  @IsBoolean()
  @IsOptional()
  billingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable media uploads' })
  @IsBoolean()
  @IsOptional()
  mediaUploadEnabled?: boolean;
}
