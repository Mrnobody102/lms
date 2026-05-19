import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSkillDto {
  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(120)
  @IsOptional()
  nameVi?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
