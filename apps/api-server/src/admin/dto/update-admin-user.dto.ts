import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A', description: 'Display name' })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(120, { message: 'Full name must be at most 120 characters' })
  fullName?: string;

  @ApiPropertyOptional({ example: '+84 123 456 789', description: 'Phone number' })
  @IsString()
  @IsOptional()
  @MaxLength(32, { message: 'Phone number must be at most 32 characters' })
  @Matches(/^[+0-9 ()-]*$/, { message: 'Phone number contains invalid characters' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.jpg',
    description: 'Avatar image URL. Send null to clear.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null && value !== '')
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  @MaxLength(2000, { message: 'Avatar URL must be at most 2000 characters' })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ description: 'Whether the user can sign in' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
