import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '@repo/database';
import { IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';

export class UpdatePlatformSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Storage quota in bytes. String is used to avoid JSON integer precision loss.',
    example: '10737418240',
  })
  @Matches(/^\d+$/, { message: 'storageQuotaBytes must be a non-negative integer string' })
  @IsOptional()
  storageQuotaBytes?: string;

  @ApiPropertyOptional({ description: 'AI request quota for the current subscription period' })
  @IsInt()
  @Min(0)
  @IsOptional()
  aiRequestQuota?: number;
}
