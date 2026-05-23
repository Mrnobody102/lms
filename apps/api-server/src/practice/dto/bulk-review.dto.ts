import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkReviewDto {
  @ApiProperty({ description: 'Question IDs to bulk approve or reject' })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
