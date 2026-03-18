import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsUUID,
  IsOptional,
} from "class-validator";

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
