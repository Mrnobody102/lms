import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class VideoHeatmapQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 300, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  bucketSeconds?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  mediaAssetId?: string;
}
