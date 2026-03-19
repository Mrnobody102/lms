import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsUrl, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "Nguyen Van A", description: "Full name" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: "+84-123-456-789", description: "Phone number" })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg", description: "Avatar URL" })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: "Invalid avatar URL" })
  @MaxLength(500)
  avatarUrl?: string;
}
