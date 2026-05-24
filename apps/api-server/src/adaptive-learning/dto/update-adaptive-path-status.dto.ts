import { ApiProperty } from '@nestjs/swagger';
import { AdaptiveLearningPathItemStatus } from '@repo/database';
import { IsEnum } from 'class-validator';

export class UpdateAdaptivePathStatusDto {
  @ApiProperty({
    enum: [
      AdaptiveLearningPathItemStatus.IN_PROGRESS,
      AdaptiveLearningPathItemStatus.COMPLETED,
      AdaptiveLearningPathItemStatus.SKIPPED,
    ],
  })
  @IsEnum(AdaptiveLearningPathItemStatus)
  status: AdaptiveLearningPathItemStatus;
}
