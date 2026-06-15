import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, SubscriptionStatus, UsageLedgerType } from '@repo/database';

import { AuditAction, AuditLogService, AuditStatus } from '../common/services/audit-log.service';
import { PrismaService } from '../common/services/prisma.service';
import { AiGatewayService } from './ai-gateway.service';
import { classifyAiProviderError } from './ai-provider-reliability';
import type { AiFeatureKey } from './ai-governance.constants';

const DEFAULT_USER_DAILY_LIMIT = 50;
const REQUEST_UNIT = 'request';
type AiLedgerMetadata = Record<string, Prisma.InputJsonValue>;

export interface AiGovernanceRunInput {
  tenantId: string;
  userId: string;
  role: string;
  feature: AiFeatureKey;
  promptVersion: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
  requireProvider?: boolean;
}

export interface AiGovernanceReservation extends AiGovernanceRunInput {
  startedAt: Date;
  provider: string;
  model: string | null;
  quotaConfigured: boolean;
}

interface TenantFeatureSettings {
  featureFlags?: Record<string, unknown>;
  features?: Record<string, unknown>;
}

@Injectable()
export class AiGovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AiGatewayService,
    private readonly auditLog: AuditLogService,
  ) {}

  getProviderSnapshot() {
    const config = this.aiGateway.getRuntimeConfig();
    return {
      provider: config.provider,
      configured: config.enabled,
      model: config.model ?? null,
    };
  }

  async withGovernance<T>(input: AiGovernanceRunInput, operation: () => Promise<T>): Promise<T> {
    const reservation = await this.reserve(input);

    try {
      const result = await operation();
      await this.recordResult(reservation, AuditStatus.SUCCESS);
      return result;
    } catch (error) {
      await this.recordResult(reservation, AuditStatus.FAILURE, error);
      await this.auditProviderFailure(reservation, error);
      throw error;
    }
  }

  async reserve(input: AiGovernanceRunInput): Promise<AiGovernanceReservation> {
    await this.ensureTenantAiEnabled(input);

    const provider = this.getProviderSnapshot();
    if ((input.requireProvider ?? true) && !provider.configured) {
      await this.auditLog.log({
        tenantId: input.tenantId,
        userId: input.userId,
        action: AuditAction.AI_PROVIDER_FAILURE,
        status: AuditStatus.FAILURE,
        metadata: {
          feature: input.feature,
          promptVersion: input.promptVersion,
          provider: provider.provider,
          reason: 'provider_not_configured',
        },
      });
      throw new ServiceUnavailableException('AI provider is not configured');
    }

    await this.ensureUserQuotaAvailable(input);
    const quotaConfigured = await this.ensureTenantQuota(input);
    await this.incrementUserQuota(input);

    return {
      ...input,
      startedAt: new Date(),
      provider: provider.provider,
      model: provider.model,
      quotaConfigured,
    };
  }

  private async ensureTenantAiEnabled(input: AiGovernanceRunInput): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: input.tenantId },
      select: { id: true, isActive: true, settings: true },
    });

    if (!tenant?.isActive || !readAiTutorEnabled(tenant.settings)) {
      throw new ForbiddenException('AI features are disabled for this tenant');
    }
  }

  private async ensureUserQuotaAvailable(input: AiGovernanceRunInput): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextReset = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    let quota = await this.prisma.aiUsageQuota.findUnique({
      where: {
        tenantId_userId: {
          tenantId: input.tenantId,
          userId: input.userId,
        },
      },
    });

    if (!quota) {
      quota = await this.prisma.aiUsageQuota.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          resetAt: nextReset,
          requestLimit: DEFAULT_USER_DAILY_LIMIT,
        },
      });
    }

    if (quota.resetAt <= new Date()) {
      quota = await this.prisma.aiUsageQuota.update({
        where: { tenantId_userId: { tenantId: input.tenantId, userId: input.userId } },
        data: {
          requestsUsed: 0,
          resetAt: nextReset,
        },
      });
    }

    if (quota.requestsUsed >= quota.requestLimit) {
      await this.auditQuotaDenied(input, 'user_daily_quota_exhausted', {
        requestsUsed: quota.requestsUsed,
        requestLimit: quota.requestLimit,
        resetAt: quota.resetAt.toISOString(),
      });
      throw new HttpException('AI user quota exhausted', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async incrementUserQuota(input: AiGovernanceRunInput): Promise<void> {
    await this.prisma.aiUsageQuota.update({
      where: { tenantId_userId: { tenantId: input.tenantId, userId: input.userId } },
      data: { requestsUsed: { increment: 1 } },
    });
  }

  private async ensureTenantQuota(input: AiGovernanceRunInput): Promise<boolean> {
    const subscription = await this.prisma.tenantSubscription.findFirst({
      where: {
        tenantId: input.tenantId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        aiRequestQuota: true,
        startsAt: true,
        endsAt: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
      },
    });

    if (!subscription) {
      return false;
    }

    const periodStart =
      subscription.currentPeriodStart ?? subscription.startsAt ?? subscription.createdAt;
    const periodEnd = subscription.currentPeriodEnd ?? subscription.endsAt ?? undefined;
    const aggregate = await this.prisma.usageLedger.aggregate({
      where: {
        tenantId: input.tenantId,
        type: UsageLedgerType.AI_REQUEST,
        occurredAt: {
          gte: periodStart,
          ...(periodEnd ? { lt: periodEnd } : {}),
        },
      },
      _sum: { quantity: true },
    });
    const used = Number(aggregate._sum.quantity ?? 0);

    if (used >= subscription.aiRequestQuota) {
      await this.auditQuotaDenied(input, 'tenant_period_quota_exhausted', {
        used,
        requestLimit: subscription.aiRequestQuota,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd?.toISOString() ?? null,
      });
      throw new HttpException('AI tenant quota exhausted', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  async recordResult(
    reservation: AiGovernanceReservation,
    status: AuditStatus,
    error?: unknown,
  ): Promise<void> {
    const metadata = toInputJsonObject(reservation.metadata);
    metadata.userId = reservation.userId;
    metadata.role = reservation.role;
    metadata.provider = reservation.provider;
    metadata.model = reservation.model ?? 'unknown';
    metadata.promptVersion = reservation.promptVersion;
    metadata.quotaConfigured = reservation.quotaConfigured;
    metadata.status = status;
    metadata.durationMs = Date.now() - reservation.startedAt.getTime();

    if (error !== undefined) {
      const failure = classifyAiProviderError(error);
      metadata.error = failure.message;
      metadata.failureCategory = failure.category;
      metadata.retryable = failure.retryable;
      if (failure.statusCode !== undefined) {
        metadata.statusCode = failure.statusCode;
      }
    }

    await this.prisma.usageLedger.create({
      data: {
        tenantId: reservation.tenantId,
        type: UsageLedgerType.AI_REQUEST,
        quantity: BigInt(1),
        unit: REQUEST_UNIT,
        sourceType: reservation.feature,
        sourceId: reservation.sourceId,
        description: `AI request: ${reservation.feature}`,
        metadata,
      },
    });
  }

  private async auditQuotaDenied(
    input: AiGovernanceRunInput,
    reason: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.auditLog.log({
      tenantId: input.tenantId,
      userId: input.userId,
      action: AuditAction.AI_QUOTA_DENIED,
      status: AuditStatus.FAILURE,
      metadata: {
        ...metadata,
        feature: input.feature,
        promptVersion: input.promptVersion,
        reason,
      },
    });
  }

  private async auditProviderFailure(
    reservation: AiGovernanceReservation,
    error: unknown,
  ): Promise<void> {
    const failure = classifyAiProviderError(error);
    const metadata: Record<string, unknown> = {
      feature: reservation.feature,
      promptVersion: reservation.promptVersion,
      provider: reservation.provider,
      model: reservation.model,
      error: failure.message,
      failureCategory: failure.category,
      retryable: failure.retryable,
    };
    if (failure.statusCode !== undefined) {
      metadata.statusCode = failure.statusCode;
    }

    await this.auditLog.log({
      tenantId: reservation.tenantId,
      userId: reservation.userId,
      action: AuditAction.AI_PROVIDER_FAILURE,
      status: AuditStatus.FAILURE,
      metadata,
    });
  }
}

function readAiTutorEnabled(settings: unknown): boolean {
  const record = toRecord(settings) as TenantFeatureSettings;
  const canonical = toRecord(record.featureFlags);
  const legacy = toRecord(record.features);
  return readBoolean(canonical.aiTutorEnabled ?? legacy.aiTutorEnabled, true);
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toInputJsonObject(record?: Record<string, unknown>): AiLedgerMetadata {
  const json: AiLedgerMetadata = {};

  for (const [key, value] of Object.entries(record ?? {})) {
    const normalized = toInputJsonValue(value);
    if (normalized !== undefined) {
      json[key] = normalized;
    }
  }

  return json;
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toInputJsonValue(item))
      .filter((item): item is Prisma.InputJsonValue => item !== undefined);
  }

  if (typeof value === 'object') {
    return toInputJsonObject(value as Record<string, unknown>);
  }

  return undefined;
}
