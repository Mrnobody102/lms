import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches, MaxLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A', description: 'Full name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: '+84 123 456 789', description: 'Phone number', nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^[+0-9 ()-]*$/, { message: 'Phone number contains invalid characters' })
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null && value !== '')
  @IsUrl({}, { message: 'Invalid avatar URL' })
  @MaxLength(2000)
  avatarUrl?: string | null;
}
