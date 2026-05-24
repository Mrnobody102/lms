import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketplacePricingModel, MarketplaceResourceType } from '@repo/database';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMarketplaceItemDto {
  @ApiProperty({ enum: MarketplaceResourceType })
  @IsEnum(MarketplaceResourceType)
  resourceType: MarketplaceResourceType;

  @ApiProperty({ description: 'Course ID or MediaAsset ID owned by the publishing tenant' })
  @IsUUID()
  resourceId: string;

  @ApiProperty({ maxLength: 180 })
  @IsString()
  @MaxLength(180)
  title: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: MarketplacePricingModel, default: MarketplacePricingModel.FREE })
  @IsOptional()
  @IsEnum(MarketplacePricingModel)
  pricingModel?: MarketplacePricingModel;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional({ default: 'USD', maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 10000, default: 7000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  revenueShareBps?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Optional structured package metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
