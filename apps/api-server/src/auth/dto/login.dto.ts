import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "user@example.com", description: "User email address" })
  @IsEmail({}, { message: "Invalid email format" })
  @MaxLength(255, { message: "Email must be at most 255 characters" })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "password123", description: "User password (min 8, max 128 characters)" })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128, { message: "Password must be at most 128 characters" })
  @IsNotEmpty()
  password: string;
}
