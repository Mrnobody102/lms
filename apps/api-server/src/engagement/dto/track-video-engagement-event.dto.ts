import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VideoEngagementEventType } from '@repo/database';
import { IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class TrackVideoEngagementEventDto {
  @ApiProperty({ enum: VideoEngagementEventType })
  @IsEnum(VideoEngagementEventType)
  eventType: VideoEngagementEventType;

  @ApiProperty({ minimum: 0, maximum: 86400 })
  @IsInt()
  @Min(0)
  @Max(86400)
  positionSeconds: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 86400 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  durationSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  mediaAssetId?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 86400 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  segmentStartSeconds?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 86400 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  segmentEndSeconds?: number;

  @ApiPropertyOptional({ minimum: 0.25, maximum: 4 })
  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(4)
  playbackRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
