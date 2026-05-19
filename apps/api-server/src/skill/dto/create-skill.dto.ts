import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({
    description: 'Uppercase canonical code, e.g. VOCABULARY',
    example: 'VOCABULARY',
  })
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be uppercase letters/digits/underscore, starting with a letter',
  })
  code!: string;

  @ApiProperty({ description: 'English (primary) display name' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Vietnamese display name', required: false })
  @IsString()
  @MaxLength(120)
  @IsOptional()
  nameVi?: string;

  @ApiProperty({ description: 'Hex color for badge', required: false, example: '#22c55e' })
  @IsString()
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
