import { IsString, IsNotEmpty, IsOptional, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@repo/database";

export class CreateTenantDto {
  @ApiProperty({ example: "Trung tâm Tiếng Anh ABC" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "trung-tam-abc" })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: "abc.com" })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiPropertyOptional({
    example: {
      logoUrl: "https://example.com/logo.png",
      primaryColor: "#000000",
    },
  })
  @IsObject()
  @IsOptional()
  settings?: Prisma.InputJsonValue;
}
