import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_COMPLEXITY_REGEX,
} from '../../common/validation/password-policy';

export class CreateInstructorDto {
  @ApiProperty({ example: 'teacher@example.com', description: 'Instructor email address' })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255, { message: 'Email must be at most 255 characters' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password@123',
    description:
      'Instructor password (min 8, max 128 chars, must contain uppercase, lowercase, number, special char)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must be at most 128 characters' })
  @Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Nguyen Van A', description: 'Instructor full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Full name must be at most 100 characters' })
  fullName: string;

  @ApiPropertyOptional({ example: '+84 123 456 789', description: 'Instructor phone number' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the instructor can sign in' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
