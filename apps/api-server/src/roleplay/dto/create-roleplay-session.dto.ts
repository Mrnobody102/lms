import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoleplayMode } from '@repo/database';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoleplaySessionDto {
  @ApiPropertyOptional({ description: 'Published scenario ID for scenario-based roleplay' })
  @IsOptional()
  @IsUUID()
  scenarioId?: string;

  @ApiPropertyOptional({ description: 'Legacy free-text scenario prompt' })
  @IsOptional()
  @IsString()
  scenario?: string;

  @ApiPropertyOptional({ enum: RoleplayMode, default: RoleplayMode.TEXT })
  @IsOptional()
  @IsEnum(RoleplayMode)
  mode?: RoleplayMode;
}
