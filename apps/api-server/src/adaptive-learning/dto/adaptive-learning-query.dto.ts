import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdaptiveLearningPathItemStatus } from '@repo/database';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class AdaptiveLearningQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: AdaptiveLearningPathItemStatus })
  @IsOptional()
  @IsEnum(AdaptiveLearningPathItemStatus)
  status?: AdaptiveLearningPathItemStatus;
}
