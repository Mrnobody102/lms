import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscussionTargetType } from '@repo/database';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min, ValidateIf } from 'class-validator';

export class DiscussionQueryDto {
  @ApiProperty({ enum: DiscussionTargetType, description: 'Discussion target type' })
  @IsEnum(DiscussionTargetType)
  targetType: DiscussionTargetType;

  @ApiPropertyOptional({ description: 'Lesson ID when targetType is LESSON' })
  @ValidateIf((dto: DiscussionQueryDto) => dto.targetType === DiscussionTargetType.LESSON)
  @IsUUID()
  lessonId?: string;

  @ApiPropertyOptional({
    description: 'Practice exercise set ID when targetType is PRACTICE_EXERCISE_SET',
  })
  @ValidateIf(
    (dto: DiscussionQueryDto) => dto.targetType === DiscussionTargetType.PRACTICE_EXERCISE_SET,
  )
  @IsUUID()
  exerciseSetId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;
}
