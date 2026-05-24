import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketplaceUsageEventType } from '@repo/database';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateMarketplaceUsageEventDto {
  @ApiProperty({ enum: MarketplaceUsageEventType })
  @IsEnum(MarketplaceUsageEventType)
  eventType: MarketplaceUsageEventType;

  @ApiPropertyOptional({ minimum: 1, maximum: 10000, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  quantity?: number = 1;

  @ApiPropertyOptional({ minimum: 0, maximum: 86400 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  seconds?: number;
}
