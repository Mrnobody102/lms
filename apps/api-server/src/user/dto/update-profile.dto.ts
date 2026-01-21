import { IsString, IsOptional, IsUrl } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
