import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import {
  BillingExportFormat,
  BillingPaymentProvider,
  UpdateBillingConfigDto,
} from './dto/update-billing-config.dto';

export interface BillingConfig {
  paymentProvider: BillingPaymentProvider;
  paymentPublicKey: string;
  paymentMerchantId: string;
  paymentWebhookUrl: string;
  currency: string;
  baseCoursePriceMinor: number;
  discountPercent: number;
  taxPercent: number;
  invoicePrefix: string;
  exportFormat: BillingExportFormat;
  updatedAt: string | null;
}

export interface BillingOverview {
  subscription: {
    planName: string;
    status: string;
    storageQuotaBytes: string;
    aiRequestQuota: number;
  } | null;
  invoices: Array<{
    id: string;
    number: string;
    status: string;
    currency: string;
    totalMinor: number;
    dueAt: Date | null;
    paidAt: Date | null;
  }>;
  payments: Array<{
    id: string;
    status: string;
    provider: string;
    currency: string;
    amountMinor: number;
    paidAt: Date | null;
  }>;
}

const DEFAULT_BILLING_CONFIG: BillingConfig = {
  paymentProvider: BillingPaymentProvider.NONE,
  paymentPublicKey: '',
  paymentMerchantId: '',
  paymentWebhookUrl: '',
  currency: 'VND',
  baseCoursePriceMinor: 0,
  discountPercent: 0,
  taxPercent: 0,
  invoicePrefix: 'INV',
  exportFormat: BillingExportFormat.CSV,
  updatedAt: null,
};

@Injectable()
export class AdminBillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getBillingConfig(currentUser: AuthenticatedUser): Promise<BillingConfig> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: currentUser.tenantId },
      select: { settings: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.readBillingConfig(tenant.settings);
  }

  async updateBillingConfig(
    currentUser: AuthenticatedUser,
    dto: UpdateBillingConfigDto,
  ): Promise<BillingConfig> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: currentUser.tenantId },
      select: { settings: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const currentSettings = this.toSettingsObject(tenant.settings);
    const currentBilling = this.readBillingConfig(currentSettings);
    const nextBilling: BillingConfig = {
      ...currentBilling,
      ...this.compactUpdate(dto),
      updatedAt: new Date().toISOString(),
    };

    const nextSettings = {
      ...currentSettings,
      billing: this.toBillingJson(nextBilling),
    } as Prisma.InputJsonObject;

    await this.prisma.tenant.update({
      where: { id: currentUser.tenantId },
      data: {
        settings: nextSettings,
      },
    });

    return nextBilling;
  }

  async getBillingOverview(currentUser: AuthenticatedUser): Promise<BillingOverview> {
    const [subscription, invoices, payments] = await Promise.all([
      this.prisma.tenantSubscription.findFirst({
        where: { tenantId: currentUser.tenantId },
        orderBy: { createdAt: 'desc' },
        include: { plan: { select: { name: true } } },
      }),
      this.prisma.invoice.findMany({
        where: { tenantId: currentUser.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          number: true,
          status: true,
          currency: true,
          totalMinor: true,
          dueAt: true,
          paidAt: true,
        },
      }),
      this.prisma.payment.findMany({
        where: { tenantId: currentUser.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          status: true,
          provider: true,
          currency: true,
          amountMinor: true,
          paidAt: true,
        },
      }),
    ]);

    return {
      subscription: subscription
        ? {
            planName: subscription.plan.name,
            status: subscription.status,
            storageQuotaBytes: subscription.storageQuotaBytes.toString(),
            aiRequestQuota: subscription.aiRequestQuota,
          }
        : null,
      invoices,
      payments,
    };
  }

  private readBillingConfig(settings: Prisma.JsonValue | Record<string, unknown> | null) {
    const settingsObject = this.toSettingsObject(settings);
    const billing = isRecord(settingsObject.billing) ? settingsObject.billing : {};

    return {
      ...DEFAULT_BILLING_CONFIG,
      ...pickBillingConfig(billing),
    };
  }

  private compactUpdate(dto: UpdateBillingConfigDto): Partial<BillingConfig> {
    const update: Partial<BillingConfig> = {};

    if (dto.paymentProvider !== undefined) update.paymentProvider = dto.paymentProvider;
    if (dto.paymentPublicKey !== undefined) update.paymentPublicKey = dto.paymentPublicKey.trim();
    if (dto.paymentMerchantId !== undefined)
      update.paymentMerchantId = dto.paymentMerchantId.trim();
    if (dto.paymentWebhookUrl !== undefined)
      update.paymentWebhookUrl = dto.paymentWebhookUrl.trim();
    if (dto.currency !== undefined) update.currency = dto.currency.trim().toUpperCase();
    if (dto.baseCoursePriceMinor !== undefined)
      update.baseCoursePriceMinor = dto.baseCoursePriceMinor;
    if (dto.discountPercent !== undefined) update.discountPercent = dto.discountPercent;
    if (dto.taxPercent !== undefined) update.taxPercent = dto.taxPercent;
    if (dto.invoicePrefix !== undefined)
      update.invoicePrefix = dto.invoicePrefix.trim().toUpperCase();
    if (dto.exportFormat !== undefined) update.exportFormat = dto.exportFormat;

    return update;
  }

  private toSettingsObject(settings: Prisma.JsonValue | Record<string, unknown> | null) {
    return isRecord(settings) ? settings : {};
  }

  private toBillingJson(config: BillingConfig): Prisma.InputJsonObject {
    return {
      paymentProvider: config.paymentProvider,
      paymentPublicKey: config.paymentPublicKey,
      paymentMerchantId: config.paymentMerchantId,
      paymentWebhookUrl: config.paymentWebhookUrl,
      currency: config.currency,
      baseCoursePriceMinor: config.baseCoursePriceMinor,
      discountPercent: config.discountPercent,
      taxPercent: config.taxPercent,
      invoicePrefix: config.invoicePrefix,
      exportFormat: config.exportFormat,
      updatedAt: config.updatedAt,
    };
  }
}

function pickBillingConfig(value: Record<string, unknown>): Partial<BillingConfig> {
  const config: Partial<BillingConfig> = {};

  if (isPaymentProvider(value.paymentProvider)) config.paymentProvider = value.paymentProvider;
  if (typeof value.paymentPublicKey === 'string') config.paymentPublicKey = value.paymentPublicKey;
  if (typeof value.paymentMerchantId === 'string')
    config.paymentMerchantId = value.paymentMerchantId;
  if (typeof value.paymentWebhookUrl === 'string')
    config.paymentWebhookUrl = value.paymentWebhookUrl;
  if (typeof value.currency === 'string') config.currency = value.currency;
  if (typeof value.baseCoursePriceMinor === 'number')
    config.baseCoursePriceMinor = value.baseCoursePriceMinor;
  if (typeof value.discountPercent === 'number') config.discountPercent = value.discountPercent;
  if (typeof value.taxPercent === 'number') config.taxPercent = value.taxPercent;
  if (typeof value.invoicePrefix === 'string') config.invoicePrefix = value.invoicePrefix;
  if (isExportFormat(value.exportFormat)) config.exportFormat = value.exportFormat;
  if (typeof value.updatedAt === 'string') config.updatedAt = value.updatedAt;

  return config;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isPaymentProvider(value: unknown): value is BillingPaymentProvider {
  return Object.values(BillingPaymentProvider).includes(value as BillingPaymentProvider);
}

function isExportFormat(value: unknown): value is BillingExportFormat {
  return Object.values(BillingExportFormat).includes(value as BillingExportFormat);
}
