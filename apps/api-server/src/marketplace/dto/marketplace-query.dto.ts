import { ApiPropertyOptional } from '@nestjs/swagger';
import { MarketplaceResourceType } from '@repo/database';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class MarketplaceQueryDto {
  @ApiPropertyOptional({ enum: MarketplaceResourceType })
  @IsOptional()
  @IsEnum(MarketplaceResourceType)
  resourceType?: MarketplaceResourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerTenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
