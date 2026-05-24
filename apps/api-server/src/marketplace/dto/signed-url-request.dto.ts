import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class SignedUrlRequestDto {
  @ApiPropertyOptional({ minimum: 60, maximum: 3600, default: 900 })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(3600)
  expiresInSeconds?: number = 900;
}
