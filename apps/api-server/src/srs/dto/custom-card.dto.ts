import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CustomCardContentDto {
  @ApiProperty({ description: 'Front of the card (e.g. Vocabulary word)' })
  @IsNotEmpty()
  @IsString()
  front!: string;

  @ApiProperty({ description: 'Back of the card (e.g. Definition)', required: false })
  @IsOptional()
  @IsString()
  back?: string;

  @ApiProperty({ description: 'Phonetics or pronunciation', required: false })
  @IsOptional()
  @IsString()
  phonetics?: string;

  @ApiProperty({ description: 'Example sentence', required: false })
  @IsOptional()
  @IsString()
  example?: string;
}

export class CreateCustomCardDto {
  @ApiProperty({ description: 'Custom content of the card' })
  @IsObject()
  @ValidateNested()
  @Type(() => CustomCardContentDto)
  customContent!: CustomCardContentDto;

  @ApiProperty({ description: 'List of skill codes associated with this card', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillCodes?: string[];
}
