import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty } from "class-validator";

export class UpdateUserStatusDto {
  @ApiProperty({ example: true, description: "Account active status" })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
