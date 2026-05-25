import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRoleplayAudioMessageDto {
  @ApiProperty({ example: 'media-asset-uuid' })
  @IsUUID()
  mediaAssetId: string;

  @ApiPropertyOptional({ example: 'Hello, I would like to order a coffee.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  expectedText?: string;

  @ApiPropertyOptional({ example: 'Audio response submitted by learner.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;
}
