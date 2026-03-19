import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { Role } from "@repo/database";

export class AdminUserQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Page number", default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: "Items per page", default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ example: "user@example.com", description: "Filter by email" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: Role.STUDENT, description: "Filter by role" })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: true, description: "Filter by active status" })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
