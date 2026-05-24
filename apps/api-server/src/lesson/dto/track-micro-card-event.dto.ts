import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LearningActivityType } from '@repo/database';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TrackMicroCardEventDto {
  @ApiProperty({ example: 'card-1' })
  @IsString()
  cardKey: string;

  @ApiProperty({
    enum: [
      LearningActivityType.MICRO_CARD_VIEWED,
      LearningActivityType.MICRO_CARD_FLIPPED,
      LearningActivityType.MICRO_CARD_COMPLETED,
    ],
  })
  @IsEnum(LearningActivityType)
  eventType: LearningActivityType;

  @ApiPropertyOptional({ minimum: 0, maximum: 3_600_000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3_600_000)
  durationMs?: number;
}
