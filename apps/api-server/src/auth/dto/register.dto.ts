import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com", description: "User email address" })
  @IsEmail({}, { message: "Invalid email format" })
  @MaxLength(255, { message: "Email must be at most 255 characters" })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "Password@123", description: "User password (min 8, max 128 chars, must contain uppercase, lowercase, number, special char)" })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(128, { message: "Password must be at most 128 characters" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    },
  )
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: "John Doe", description: "User full name" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: "Full name must be at most 100 characters" })
  fullName: string;

  @ApiPropertyOptional({ example: "+84 123 456 789", description: "User phone number" })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
