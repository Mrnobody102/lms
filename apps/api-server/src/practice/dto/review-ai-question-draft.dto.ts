import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class RejectAiQuestionDraftDto {
  @ApiProperty({ description: 'Reviewer reason for rejecting the generated draft' })
  @IsString()
  @MaxLength(1000)
  rejectionReason: string;
}

export class BulkReviewAiQuestionDraftDto {
  @ApiProperty({ type: [String], description: 'AI generated draft IDs to review' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  ids: string[];

  @ApiPropertyOptional({ description: 'Reviewer reason for bulk rejection' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  rejectionReason?: string;
}
