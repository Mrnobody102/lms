import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateDiscussionReplyDto {
  @ApiProperty({ example: 'The key idea is word order.', description: 'Reply content' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}
