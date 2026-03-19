import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsUUID,
  IsOptional,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com", description: "User email address" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "password123", description: "User password (min 8, max 128 characters)" })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(128, { message: "Password must be at most 128 characters" })
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: "John Doe", description: "User full name" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: "+84 123 456 789", description: "User phone number" })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: "uuid-of-tenant", description: "Tenant (organization) ID" })
  @IsUUID("4", { message: "tenantId must be a valid UUID" })
  @IsNotEmpty()
  tenantId: string;
}
