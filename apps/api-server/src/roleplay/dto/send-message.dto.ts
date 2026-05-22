import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'The user message content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
