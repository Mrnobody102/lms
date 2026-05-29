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
