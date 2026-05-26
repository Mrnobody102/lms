import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateDiscussionThreadDto {
  @ApiPropertyOptional({ example: 'Can you explain this grammar point?', description: 'Title' })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({
    example: 'I do not understand the second example.',
    description: 'Question',
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(5000)
  content?: string;
}
