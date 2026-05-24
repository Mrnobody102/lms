import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoleplayMode } from '@repo/database';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class RoleplayScenarioQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ enum: RoleplayMode })
  @IsOptional()
  @IsEnum(RoleplayMode)
  mode?: RoleplayMode;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
