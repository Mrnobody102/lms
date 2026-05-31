import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class PlatformTenantQueryDto {
  @ApiPropertyOptional({ description: 'Filter by tenant ID' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}

export class PlatformAuditLogQueryDto extends PlatformTenantQueryDto {
  @ApiPropertyOptional({ description: 'Filter by audit action' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  action?: string;

  @ApiPropertyOptional({ description: 'Filter from ISO date' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter until ISO date' })
  @IsDateString()
  @IsOptional()
  to?: string;
}
