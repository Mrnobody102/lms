import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  Matches,
  MaxLength,
  IsFQDN,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@repo/database';

export class CreateTenantDto {
  @ApiProperty({ example: 'Trung tâm Tiếng Anh ABC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'trung-tam-abc' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain lowercase letters, numbers, and single hyphens only',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'abc.com' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @IsFQDN()
  domain?: string;

  @ApiPropertyOptional({
    example: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#000000',
    },
  })
  @IsObject()
  @IsOptional()
  settings?: Prisma.InputJsonValue;
}
