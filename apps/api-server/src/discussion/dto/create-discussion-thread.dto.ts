import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscussionTargetType } from '@repo/database';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateDiscussionThreadDto {
  @ApiProperty({ enum: DiscussionTargetType, description: 'Discussion target type' })
  @IsEnum(DiscussionTargetType)
  targetType: DiscussionTargetType;

  @ApiPropertyOptional({ description: 'Lesson ID when targetType is LESSON' })
  @ValidateIf((dto: CreateDiscussionThreadDto) => dto.targetType === DiscussionTargetType.LESSON)
  @IsUUID()
  lessonId?: string;

  @ApiPropertyOptional({
    description: 'Practice exercise set ID when targetType is PRACTICE_EXERCISE_SET',
  })
  @ValidateIf(
    (dto: CreateDiscussionThreadDto) =>
      dto.targetType === DiscussionTargetType.PRACTICE_EXERCISE_SET,
  )
  @IsUUID()
  exerciseSetId?: string;

  @ApiPropertyOptional({ example: 'Can you explain this grammar point?', description: 'Title' })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  title?: string;

  @ApiProperty({ example: 'I do not understand the second example.', description: 'Question' })
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  content: string;
}
