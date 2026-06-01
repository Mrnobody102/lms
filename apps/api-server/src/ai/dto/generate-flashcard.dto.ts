import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  MAX_BULK_FLASHCARD_COUNT,
  MIN_BULK_FLASHCARD_COUNT,
} from '../interfaces/ai-provider.interface';

export class GenerateFlashcardDto {
  @ApiProperty({
    description: 'The vocabulary word or phrase (front of the flashcard)',
    example: 'collaborate',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  front: string;

  @ApiPropertyOptional({
    description: 'Optional context to help the AI understand the usage',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  context?: string;
}

export class GenerateFlashcardsBulkDto {
  @ApiProperty({
    description: 'The topic for the flashcards',
    example: 'Vietnamese traditional spices',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  topic: string;

  @ApiProperty({
    description: 'The number of flashcards to generate',
    example: 5,
    minimum: MIN_BULK_FLASHCARD_COUNT,
    maximum: MAX_BULK_FLASHCARD_COUNT,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_BULK_FLASHCARD_COUNT)
  @Max(MAX_BULK_FLASHCARD_COUNT)
  count: number;

  @ApiPropertyOptional({
    description: 'Optional context to help the AI understand the usage',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  context?: string;
}
