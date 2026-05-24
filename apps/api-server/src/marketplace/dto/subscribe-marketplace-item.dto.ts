import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsObject, IsOptional } from 'class-validator';

export class SubscribeMarketplaceItemDto {
  @ApiPropertyOptional({ description: 'Optional subscription end date for monthly rentals' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ description: 'Optional billing/provider metadata' })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  metadata?: Record<string, unknown>;
}
