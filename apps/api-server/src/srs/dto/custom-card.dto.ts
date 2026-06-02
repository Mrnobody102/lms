import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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

  @ApiProperty({ description: 'Learning deck name used to organize custom cards', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  deck?: string;

  @ApiProperty({ description: 'Card category such as vocabulary or grammar', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @ApiProperty({ description: 'Linked course ID for organization', required: false })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiProperty({ description: 'Linked course title snapshot for display', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  courseTitle?: string;

  @ApiProperty({ description: 'Linked course unit ID for organization', required: false })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiProperty({ description: 'Linked course unit title snapshot for display', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  unitTitle?: string;

  @ApiProperty({ description: 'Searchable card tags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
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
