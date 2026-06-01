import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionStatus } from '@repo/database';
import { MetricsService } from '../common/metrics/metrics.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { PrismaService } from '../common/services/prisma.service';
import { AuditAction, AuditLogService, AuditStatus } from '../common/services/audit-log.service';
import { PlatformAuditLogQueryDto, PlatformTenantQueryDto } from './dto/platform-query.dto';
import { UpdatePlatformFeatureFlagsDto } from './dto/update-platform-feature-flags.dto';
import { UpdatePlatformSubscriptionDto } from './dto/update-platform-subscription.dto';

const FEATURE_FLAG_KEYS = [
  'aiTutorEnabled',
  'activationCodesEnabled',
  'roleplayEnabled',
  'marketplaceEnabled',
  'billingEnabled',
  'mediaUploadEnabled',
] as const;

type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];
type FeatureFlags = Record<FeatureFlagKey, boolean>;

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  aiTutorEnabled: false,
  activationCodesEnabled: false,
  roleplayEnabled: false,
  marketplaceEnabled: false,
  billingEnabled: false,
  mediaUploadEnabled: true,
};

@Injectable()
export class AdminPlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getTenantOverview(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const [
      users,
      activeUsers,
      courses,
      enrollments,
      lessons,
      media,
      subscription,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.user.count({ where: { tenantId, deletedAt: null, isActive: true } }),
      this.prisma.course.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.courseEnrollment.count({ where: { tenantId } }),
      this.prisma.lesson.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.mediaAsset.aggregate({
        where: { tenantId },
        _count: { _all: true },
        _sum: { sizeBytes: true },
      }),
      this.prisma.tenantSubscription.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        include: { plan: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          action: true,
          status: true,
          userId: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    const settings = toRecord(tenant.settings);
    const featureFlags = readFeatureFlags(settings);
    const subscriptionQuota = subscription
      ? subscription.storageQuotaBytes.toString()
      : media._sum.sizeBytes
        ? String(media._sum.sizeBytes)
        : '0';

    return {
      tenant: {
        ...tenant,
        settings,
      },
      counts: {
        users,
        activeUsers,
        courses,
        enrollments,
        lessons,
        mediaAssets: media._count._all,
        mediaStorageBytes: media._sum.sizeBytes ?? 0,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            plan: subscription.plan,
            storageQuotaBytes: subscription.storageQuotaBytes.toString(),
            aiRequestQuota: subscription.aiRequestQuota,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
      readiness: {
        hasDomain: Boolean(tenant.domain),
        hasActiveSubscription: subscription?.status === SubscriptionStatus.ACTIVE,
        hasStorageQuota: BigInt(subscriptionQuota) > BigInt(0),
        hasAiQuota: (subscription?.aiRequestQuota ?? 0) > 0,
        featureFlags,
      },
      recentAuditLogs,
    };
  }

  async getUsage(query: PlatformTenantQueryDto) {
    const tenantWhere = this.tenantWhere(query);
    const [tenants, mediaUsage, ledgerUsage] = await Promise.all([
      this.prisma.tenant.findMany({
        where: tenantWhere,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, slug: true, isActive: true },
      }),
      this.prisma.mediaAsset.groupBy({
        by: ['tenantId'],
        where: query.tenantId ? { tenantId: query.tenantId } : undefined,
        _count: { _all: true },
        _sum: { sizeBytes: true },
      }),
      this.prisma.usageLedger.groupBy({
        by: ['tenantId', 'type', 'unit'],
        where: query.tenantId ? { tenantId: query.tenantId } : undefined,
        _sum: { quantity: true },
      }),
    ]);
    const requestMetrics = this.metrics.getSnapshot();

    return tenants.map((tenant) => {
      const media = mediaUsage.find((item) => item.tenantId === tenant.id);
      const ledger = ledgerUsage
        .filter((item) => item.tenantId === tenant.id)
        .map((item) => ({
          type: item.type,
          unit: item.unit,
          quantity: (item._sum.quantity ?? BigInt(0)).toString(),
        }));
      const traffic = requestMetrics.tenantTraffic.find((item) => item.tenantId === tenant.id);

      return {
        tenant,
        mediaAssets: media?._count._all ?? 0,
        mediaStorageBytes: media?._sum.sizeBytes ?? 0,
        ledger,
        requestMetrics: traffic
          ? {
              count: traffic.count,
              errorCount: traffic.errorCount,
              averageDurationMs: traffic.averageDurationMs,
              maxDurationMs: traffic.maxDurationMs,
              lastSeenAt: traffic.lastSeenAt,
            }
          : null,
      };
    });
  }

  async getBilling(query: PlatformTenantQueryDto) {
    const tenantId = query.tenantId;
    const where = tenantId ? { tenantId } : undefined;
    const [plans, subscriptions, invoices, payments] = await Promise.all([
      this.prisma.billingPlan.findMany({
        where,
        orderBy: [{ tenantId: 'asc' }, { createdAt: 'desc' }],
        include: { tenant: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.tenantSubscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: tenantId ? 20 : 100,
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
          plan: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: tenantId ? 20 : 100,
        include: { tenant: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: tenantId ? 20 : 100,
        include: { tenant: { select: { id: true, name: true, slug: true } } },
      }),
    ]);

    return {
      plans: plans.map((plan) => ({
        ...plan,
        storageQuotaBytes: plan.storageQuotaBytes.toString(),
      })),
      subscriptions: subscriptions.map((subscription) => ({
        ...subscription,
        storageQuotaBytes: subscription.storageQuotaBytes.toString(),
      })),
      invoices,
      payments,
    };
  }

  async updateSubscription(
    subscriptionId: string,
    dto: UpdatePlatformSubscriptionDto,
    currentUser: AuthenticatedUser,
  ) {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { id: subscriptionId },
      select: { id: true, tenantId: true },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updated = await this.prisma.tenantSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: dto.status,
        storageQuotaBytes:
          dto.storageQuotaBytes === undefined ? undefined : BigInt(dto.storageQuotaBytes),
        aiRequestQuota: dto.aiRequestQuota,
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, code: true } },
      },
    });

    await this.auditLog.log({
      tenantId: subscription.tenantId,
      userId: currentUser.id,
      action: AuditAction.PLATFORM_SUBSCRIPTION_UPDATE,
      status: AuditStatus.SUCCESS,
      metadata: {
        subscriptionId,
        status: dto.status,
        storageQuotaBytes: dto.storageQuotaBytes,
        aiRequestQuota: dto.aiRequestQuota,
      },
    });

    return {
      ...updated,
      storageQuotaBytes: updated.storageQuotaBytes.toString(),
    };
  }

  async getDomains(query: PlatformTenantQueryDto) {
    const tenants = await this.prisma.tenant.findMany({
      where: this.tenantWhere(query),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        settings: true,
        isActive: true,
      },
    });

    return tenants.map((tenant) => {
      const settings = toRecord(tenant.settings);
      const domainSettings = toRecord(settings.domain);
      return {
        tenant: omitSettings(tenant),
        domain: tenant.domain,
        status: tenant.domain ? 'configured' : 'missing',
        metadata: domainSettings,
      };
    });
  }

  async getFeatureFlags(query: PlatformTenantQueryDto) {
    const tenants = await this.prisma.tenant.findMany({
      where: this.tenantWhere(query),
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, slug: true, isActive: true, settings: true },
    });

    return tenants.map((tenant) => ({
      tenant: omitSettings(tenant),
      featureFlags: readFeatureFlags(toRecord(tenant.settings)),
    }));
  }

  async updateFeatureFlags(
    tenantId: string,
    dto: UpdatePlatformFeatureFlagsDto,
    currentUser: AuthenticatedUser,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, settings: true, name: true, slug: true, isActive: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const currentSettings = toRecord(tenant.settings);
    const currentFlags = readFeatureFlags(currentSettings);
    const nextFlags = { ...currentFlags, ...compactFeatureFlagUpdate(dto) };
    const nextSettings: Prisma.InputJsonObject = {
      ...currentSettings,
      featureFlags: nextFlags,
    };

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: nextSettings },
      select: { id: true, name: true, slug: true, isActive: true, settings: true },
    });

    await this.auditLog.log({
      tenantId,
      userId: currentUser.id,
      action: AuditAction.PLATFORM_FEATURE_FLAGS_UPDATE,
      status: AuditStatus.SUCCESS,
      metadata: { featureFlags: compactFeatureFlagUpdate(dto) },
    });

    return {
      tenant: omitSettings(updated),
      featureFlags: readFeatureFlags(toRecord(updated.settings)),
    };
  }

  async getAuditLogs(query: PlatformAuditLogQueryDto) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = new Date(query.from);
    if (query.to) createdAt.lte = new Date(query.to);

    return this.prisma.auditLog.findMany({
      where: {
        ...(query.tenantId ? { tenantId: query.tenantId } : {}),
        ...(query.action ? { action: query.action } : {}),
        ...(query.from || query.to ? { createdAt } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } },
      },
    });
  }

  async getIncidents() {
    const telemetry = this.metrics.getSnapshot();
    const alerts = await this.getRuntimeAlerts();
    const metricIncidents = telemetry.tenantTraffic
      .filter((item) => item.errorCount > 0)
      .slice(0, 20)
      .map((item) => ({
        id: `tenant-errors-${item.tenantId}`,
        severity: item.errorCount > 10 ? 'high' : 'medium',
        status: 'monitoring',
        title: 'Tenant API errors detected',
        detail: `${item.tenantId} has ${item.errorCount} errors in the in-memory metrics window.`,
        tenantId: item.tenantId,
        createdAt: item.lastSeenAt ?? telemetry.generatedAt,
      }));

    return [...alerts, ...metricIncidents];
  }

  getAiStatus() {
    const provider = normalizeAiProvider(process.env.AI_PROVIDER);
    const model = readAiModel(provider, process.env);
    const configured = isAiConfigured(provider, process.env);

    return {
      mode: 'env-managed',
      provider,
      configured,
      model,
      dynamicConfigEnabled: false,
      keyStorage: 'render-env',
      keyMasked: configured ? 'configured' : 'missing',
      frontendExposureAllowed: false,
    };
  }

  private async getRuntimeAlerts() {
    const recentFailures = await this.prisma.auditLog.findMany({
      where: {
        status: AuditStatus.FAILURE,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return recentFailures.map((log) => ({
      id: `audit-failure-${log.id}`,
      severity: 'medium',
      status: 'open',
      title: 'Recent audit failure',
      detail: `${log.action} failed for tenant ${log.tenantId}.`,
      tenantId: log.tenantId,
      createdAt: log.createdAt,
    }));
  }

  private tenantWhere(query: PlatformTenantQueryDto): Prisma.TenantWhereInput {
    return query.tenantId ? { id: query.tenantId } : {};
  }
}

function compactFeatureFlagUpdate(dto: UpdatePlatformFeatureFlagsDto): Partial<FeatureFlags> {
  const update: Partial<FeatureFlags> = {};
  for (const key of FEATURE_FLAG_KEYS) {
    if (dto[key] !== undefined) {
      update[key] = dto[key];
    }
  }
  return update;
}

function readFeatureFlags(settings: Record<string, unknown>): FeatureFlags {
  const canonical = toRecord(settings.featureFlags);
  const legacy = toRecord(settings.features);
  const flags = { ...DEFAULT_FEATURE_FLAGS };

  for (const key of FEATURE_FLAG_KEYS) {
    const value = canonical[key] ?? legacy[key];
    if (typeof value === 'boolean') {
      flags[key] = value;
    }
  }

  return flags;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function omitSettings<T extends { settings: unknown }>(value: T): Omit<T, 'settings'> {
  const { settings: _settings, ...rest } = value;
  return rest;
}

function normalizeAiProvider(value: string | undefined) {
  if (value === 'groq' || value === 'gateway') {
    return value;
  }
  return 'off';
}

function readAiModel(provider: string, env: NodeJS.ProcessEnv) {
  if (provider === 'groq') {
    return normalizeOptionalString(env.GROQ_MODEL) ?? normalizeOptionalString(env.AI_MODEL) ?? null;
  }
  if (provider === 'gateway') {
    return normalizeOptionalString(env.AI_MODEL) ?? null;
  }
  return null;
}

function isAiConfigured(provider: string, env: NodeJS.ProcessEnv) {
  if (provider === 'groq') {
    return Boolean(
      normalizeOptionalString(env.GROQ_API_KEY) ?? normalizeOptionalString(env.AI_API_KEY),
    );
  }
  if (provider === 'gateway') {
    return Boolean(normalizeOptionalString(env.AI_ENDPOINT_URL));
  }
  return false;
}

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
