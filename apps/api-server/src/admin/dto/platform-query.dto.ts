import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PlatformTenantQueryDto {
  @ApiPropertyOptional({ description: 'Filter by tenant ID' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}

export class PlatformListQueryDto extends PlatformTenantQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Items per page' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search by tenant, action, status, or record identifier' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by endpoint-specific status' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  status?: string;
}

export class PlatformAuditLogQueryDto extends PlatformListQueryDto {
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
