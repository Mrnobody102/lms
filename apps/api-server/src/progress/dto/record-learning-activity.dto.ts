import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LearningActivityType } from '@repo/database';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class RecordLearningActivityDto {
  @ApiProperty({ example: 'uuid-of-lesson', description: 'Lesson ID' })
  @IsUUID()
  lessonId: string;

  @ApiProperty({ enum: LearningActivityType, description: 'Learning activity type' })
  @IsEnum(LearningActivityType)
  type: LearningActivityType;

  @ApiPropertyOptional({
    example: 180,
    description: 'Optional tracked time spent in seconds for the activity window',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;
}
