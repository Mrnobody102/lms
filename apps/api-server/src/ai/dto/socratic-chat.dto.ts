import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant', 'system'] })
  @IsString()
  role!: 'user' | 'assistant' | 'system';

  @ApiProperty()
  @IsString()
  content!: string;
}

export class SocraticChatDto {
  @ApiProperty()
  @IsString()
  questionPrompt!: string;

  @ApiProperty()
  @IsOptional()
  studentAnswer?: unknown;

  @ApiProperty()
  @IsOptional()
  correctAnswer?: unknown;

  @ApiProperty({ type: [ChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];
}
