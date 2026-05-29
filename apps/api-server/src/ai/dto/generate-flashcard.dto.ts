import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  })
  @IsNotEmpty()
  count: number;

  @ApiPropertyOptional({
    description: 'Optional context to help the AI understand the usage',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  context?: string;
}
