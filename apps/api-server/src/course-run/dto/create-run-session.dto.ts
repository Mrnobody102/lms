import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateRunSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @ApiProperty()
  @IsDateString()
  startsAt: string;

  @ApiProperty()
  @IsDateString()
  endsAt: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  instructorId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  lessonId?: string;

  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  timezone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional()
  @IsUrl({ require_tld: false })
  @IsOptional()
  @MaxLength(500)
  onlineMeetingUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
