import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum BillingPaymentProvider {
  NONE = 'none',
  MANUAL = 'manual',
  STRIPE = 'stripe',
  PAYOS = 'payos',
  VNPAY = 'vnpay',
  MOMO = 'momo',
}

export enum BillingExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
}

export class UpdateBillingConfigDto {
  @ApiPropertyOptional({ enum: BillingPaymentProvider })
  @IsEnum(BillingPaymentProvider)
  @IsOptional()
  paymentProvider?: BillingPaymentProvider;

  @ApiPropertyOptional({ description: 'Provider public key or client id. Do not send secrets.' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  paymentPublicKey?: string;

  @ApiPropertyOptional({ description: 'Merchant/account identifier for reconciliation' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  paymentMerchantId?: string;

  @ApiPropertyOptional({ description: 'Webhook URL configured at the provider' })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'Webhook URL must be a valid URL' })
  @MaxLength(500)
  paymentWebhookUrl?: string;

  @ApiPropertyOptional({ example: 'VND' })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Default course price in minor units' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100000000000)
  baseCoursePriceMinor?: number;

  @ApiPropertyOptional({ description: 'Default discount percent' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Tax percent applied for invoices' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  taxPercent?: number;

  @ApiPropertyOptional({ example: 'INV' })
  @IsString()
  @IsOptional()
  @MaxLength(12)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Invoice prefix must use uppercase letters, numbers, or hyphens',
  })
  invoicePrefix?: string;

  @ApiPropertyOptional({ enum: BillingExportFormat })
  @IsEnum(BillingExportFormat)
  @IsOptional()
  exportFormat?: BillingExportFormat;
}
