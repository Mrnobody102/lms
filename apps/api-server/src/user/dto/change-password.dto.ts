import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength, MaxLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: "OldPassword123!", description: "Current password" })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: "NewPassword123!", description: "New password (min 8, max 128 characters" })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128, { message: "Password must be at most 128 characters" })
  @IsNotEmpty()
  newPassword: string;
}
