import { ApiPropertyOptional } from '@nestjs/swagger';
import { AiGenerationJobStatus } from '@repo/database';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class AiGenerationJobQueryDto {
  @ApiPropertyOptional({ enum: AiGenerationJobStatus })
  @IsEnum(AiGenerationJobStatus)
  @IsOptional()
  status?: AiGenerationJobStatus;

  @ApiPropertyOptional({ description: 'Filter by course ID' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
