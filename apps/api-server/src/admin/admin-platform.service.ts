import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BillingPlanStatus,
  InvoiceStatus,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
} from '@repo/database';
import { MetricsService } from '../common/metrics/metrics.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { PrismaService } from '../common/services/prisma.service';
import { AuditAction, AuditLogService, AuditStatus } from '../common/services/audit-log.service';
import { PlatformAuditLogQueryDto, PlatformListQueryDto } from './dto/platform-query.dto';
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
type PlatformMediaUsage = {
  tenantId: string;
  _count: { _all: number };
  _sum: { sizeBytes: number | null };
};
type PlatformLedgerUsage = {
  tenantId: string;
  type: string;
  unit: string;
  _sum: { quantity: bigint | number | null };
};
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

interface PlatformIncident {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'warning' | 'critical';
  status: string;
  title: string;
  detail: string;
  tenantId?: string | null;
  createdAt: Date | string;
}

type PlatformTenantStatusMode = 'active' | 'domain';

const DEFAULT_PLATFORM_PAGE = 1;
const DEFAULT_PLATFORM_LIMIT = 20;
const MAX_PLATFORM_LIMIT = 100;
const INCIDENT_SIGNAL_LIMIT = 100;

const TENANT_SELECT = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
} satisfies Prisma.TenantSelect;

const TENANT_WITH_DOMAIN_SELECT = {
  ...TENANT_SELECT,
  domain: true,
  settings: true,
} satisfies Prisma.TenantSelect;

const TENANT_WITH_SETTINGS_SELECT = {
  ...TENANT_SELECT,
  settings: true,
} satisfies Prisma.TenantSelect;

const BILLING_TENANT_SELECT = { id: true, name: true, slug: true } satisfies Prisma.TenantSelect;
const BILLING_PLAN_SELECT = { id: true, name: true, code: true } satisfies Prisma.BillingPlanSelect;

type UsageTenantRow = Prisma.TenantGetPayload<{ select: typeof TENANT_SELECT }>;
type DomainTenantRow = Prisma.TenantGetPayload<{ select: typeof TENANT_WITH_DOMAIN_SELECT }>;
type FeatureFlagTenantRow = Prisma.TenantGetPayload<{ select: typeof TENANT_WITH_SETTINGS_SELECT }>;

type BillingPlanRow = Prisma.BillingPlanGetPayload<{
  include: { tenant: { select: typeof BILLING_TENANT_SELECT } };
}>;
type BillingSubscriptionRow = Prisma.TenantSubscriptionGetPayload<{
  include: {
    tenant: { select: typeof BILLING_TENANT_SELECT };
    plan: { select: typeof BILLING_PLAN_SELECT };
  };
}>;

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

  async getUsage(query: PlatformListQueryDto) {
    const { page, limit, skip } = getPagination(query);
    const tenantWhere = this.tenantWhere(query, 'active');
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: tenantWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: TENANT_SELECT,
      }),
      this.prisma.tenant.count({ where: tenantWhere }),
    ]);
    const tenantIds = tenants.map((tenant) => tenant.id);
    const [mediaUsage, ledgerUsage] = await Promise.all([
      tenantIds.length
        ? this.prisma.mediaAsset.groupBy({
            by: ['tenantId'],
            where: { tenantId: { in: tenantIds } },
            _count: { _all: true },
            _sum: { sizeBytes: true },
          })
        : Promise.resolve([] as PlatformMediaUsage[]),
      tenantIds.length
        ? this.prisma.usageLedger.groupBy({
            by: ['tenantId', 'type', 'unit'],
            where: { tenantId: { in: tenantIds } },
            _sum: { quantity: true },
          })
        : Promise.resolve([] as PlatformLedgerUsage[]),
    ]);
    const requestMetrics = this.metrics.getSnapshot();

    const items = tenants.map((tenant: UsageTenantRow) => {
      const media = mediaUsage.find((item) => item.tenantId === tenant.id);
      const ledger = ledgerUsage
        .filter((item) => item.tenantId === tenant.id)
        .map((item) => ({
          type: item.type,
          unit: item.unit,
          quantity: String(item._sum.quantity ?? 0),
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

    return toPaginatedResult(items, total, page, limit);
  }

  async getBilling(query: PlatformListQueryDto) {
    const { page, limit, skip } = getPagination(query);
    const tenantId = query.tenantId;
    const normalizedSearch = normalizeOptionalString(query.search);
    const normalizedStatus = normalizeStatus(query.status);
    const planWhere = this.billingPlanWhere(tenantId, normalizedSearch, normalizedStatus);
    const subscriptionWhere = this.billingSubscriptionWhere(
      tenantId,
      normalizedSearch,
      normalizedStatus,
    );
    const invoiceWhere = this.billingInvoiceWhere(tenantId, normalizedSearch, normalizedStatus);
    const paymentWhere = this.billingPaymentWhere(tenantId, normalizedSearch, normalizedStatus);

    const [
      plans,
      plansTotal,
      subscriptions,
      subscriptionsTotal,
      invoices,
      invoicesTotal,
      payments,
      paymentsTotal,
    ] = await Promise.all([
      this.prisma.billingPlan.findMany({
        where: planWhere,
        orderBy: [{ tenantId: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: { tenant: { select: BILLING_TENANT_SELECT } },
      }),
      this.prisma.billingPlan.count({ where: planWhere }),
      this.prisma.tenantSubscription.findMany({
        where: subscriptionWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          tenant: { select: BILLING_TENANT_SELECT },
          plan: { select: BILLING_PLAN_SELECT },
        },
      }),
      this.prisma.tenantSubscription.count({ where: subscriptionWhere }),
      this.prisma.invoice.findMany({
        where: invoiceWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { tenant: { select: BILLING_TENANT_SELECT } },
      }),
      this.prisma.invoice.count({ where: invoiceWhere }),
      this.prisma.payment.findMany({
        where: paymentWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { tenant: { select: BILLING_TENANT_SELECT } },
      }),
      this.prisma.payment.count({ where: paymentWhere }),
    ]);

    return {
      summary: {
        plans: plansTotal,
        subscriptions: subscriptionsTotal,
        invoices: invoicesTotal,
        payments: paymentsTotal,
      },
      plans: toPaginatedResult(
        plans.map((plan: BillingPlanRow) => ({
          ...plan,
          storageQuotaBytes: plan.storageQuotaBytes.toString(),
        })),
        plansTotal,
        page,
        limit,
      ),
      subscriptions: toPaginatedResult(
        subscriptions.map((subscription: BillingSubscriptionRow) => ({
          ...subscription,
          storageQuotaBytes: subscription.storageQuotaBytes.toString(),
        })),
        subscriptionsTotal,
        page,
        limit,
      ),
      invoices: toPaginatedResult(invoices, invoicesTotal, page, limit),
      payments: toPaginatedResult(payments, paymentsTotal, page, limit),
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

  async getDomains(query: PlatformListQueryDto) {
    const { page, limit, skip } = getPagination(query);
    const tenantWhere = this.tenantWhere(query, 'domain');
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: tenantWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: TENANT_WITH_DOMAIN_SELECT,
      }),
      this.prisma.tenant.count({ where: tenantWhere }),
    ]);

    const items = tenants.map((tenant: DomainTenantRow) => {
      const settings = toRecord(tenant.settings);
      const domainSettings = toRecord(settings.domain);
      return {
        tenant: omitSettings(tenant),
        domain: tenant.domain,
        status: tenant.domain ? 'configured' : 'missing',
        metadata: domainSettings,
      };
    });

    return toPaginatedResult(items, total, page, limit);
  }

  async getFeatureFlags(query: PlatformListQueryDto) {
    const { page, limit, skip } = getPagination(query);
    const tenantWhere = this.tenantWhere(query, 'active');
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: tenantWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: TENANT_WITH_SETTINGS_SELECT,
      }),
      this.prisma.tenant.count({ where: tenantWhere }),
    ]);

    const items = tenants.map((tenant: FeatureFlagTenantRow) => ({
      tenant: omitSettings(tenant),
      featureFlags: readFeatureFlags(toRecord(tenant.settings)),
    }));

    return toPaginatedResult(items, total, page, limit);
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
    const { page, limit, skip } = getPagination(query);
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = new Date(query.from);
    if (query.to) createdAt.lte = new Date(query.to);
    const where = this.auditLogWhere(query, createdAt);

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, fullName: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, limit);
  }

  async getIncidents(query: PlatformListQueryDto = {}) {
    const { page, limit, skip } = getPagination(query);
    const telemetry = this.metrics.getSnapshot();
    const alerts = await this.getRuntimeAlerts();
    const metricIncidents = telemetry.tenantTraffic
      .filter((item) => item.errorCount > 0)
      .slice(0, INCIDENT_SIGNAL_LIMIT)
      .map((item) => ({
        id: `tenant-errors-${item.tenantId}`,
        severity: item.errorCount > 10 ? ('high' as const) : ('medium' as const),
        status: 'monitoring',
        title: 'Tenant API errors detected',
        detail: `${item.tenantId} has ${item.errorCount} errors in the in-memory metrics window.`,
        tenantId: item.tenantId,
        createdAt: item.lastSeenAt ?? telemetry.generatedAt,
      }));

    const filtered = filterIncidents([...alerts, ...metricIncidents], query);
    return toPaginatedResult(filtered.slice(skip, skip + limit), filtered.length, page, limit);
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

  private async getRuntimeAlerts(): Promise<PlatformIncident[]> {
    const recentFailures = await this.prisma.auditLog.findMany({
      where: {
        status: AuditStatus.FAILURE,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: INCIDENT_SIGNAL_LIMIT,
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

  private tenantWhere(
    query: PlatformListQueryDto,
    statusMode: PlatformTenantStatusMode,
  ): Prisma.TenantWhereInput {
    const and: Prisma.TenantWhereInput[] = [];
    if (query.tenantId) {
      and.push({ id: query.tenantId });
    }

    const search = normalizeOptionalString(query.search);
    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { domain: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const status = normalizeStatus(query.status);
    if (statusMode === 'active') {
      if (status === 'active') and.push({ isActive: true });
      if (status === 'inactive') and.push({ isActive: false });
    }
    if (statusMode === 'domain') {
      if (status === 'configured') and.push({ domain: { not: null } });
      if (status === 'missing') and.push({ domain: null });
      if (status === 'active') and.push({ isActive: true });
      if (status === 'inactive') and.push({ isActive: false });
    }

    return and.length ? { AND: and } : {};
  }

  private billingPlanWhere(
    tenantId: string | undefined,
    search: string | undefined,
    status: string | undefined,
  ): Prisma.BillingPlanWhereInput {
    const and: Prisma.BillingPlanWhereInput[] = [];
    if (tenantId) and.push({ tenantId });
    if (search) {
      and.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    const enumStatus = toEnumValue(BillingPlanStatus, status);
    if (enumStatus) and.push({ status: enumStatus });
    return and.length ? { AND: and } : {};
  }

  private billingSubscriptionWhere(
    tenantId: string | undefined,
    search: string | undefined,
    status: string | undefined,
  ): Prisma.TenantSubscriptionWhereInput {
    const and: Prisma.TenantSubscriptionWhereInput[] = [];
    if (tenantId) and.push({ tenantId });
    if (search) {
      and.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { plan: { name: { contains: search, mode: 'insensitive' } } },
          { plan: { code: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }
    const enumStatus = toEnumValue(SubscriptionStatus, status);
    if (enumStatus) and.push({ status: enumStatus });
    return and.length ? { AND: and } : {};
  }

  private billingInvoiceWhere(
    tenantId: string | undefined,
    search: string | undefined,
    status: string | undefined,
  ): Prisma.InvoiceWhereInput {
    const and: Prisma.InvoiceWhereInput[] = [];
    if (tenantId) and.push({ tenantId });
    if (search) {
      and.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { number: { contains: search, mode: 'insensitive' } },
          { currency: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    const enumStatus = toEnumValue(InvoiceStatus, status);
    if (enumStatus) and.push({ status: enumStatus });
    return and.length ? { AND: and } : {};
  }

  private billingPaymentWhere(
    tenantId: string | undefined,
    search: string | undefined,
    status: string | undefined,
  ): Prisma.PaymentWhereInput {
    const and: Prisma.PaymentWhereInput[] = [];
    if (tenantId) and.push({ tenantId });
    if (search) {
      and.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { provider: { contains: search, mode: 'insensitive' } },
          { currency: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    const enumStatus = toEnumValue(PaymentStatus, status);
    if (enumStatus) and.push({ status: enumStatus });
    return and.length ? { AND: and } : {};
  }

  private auditLogWhere(
    query: PlatformAuditLogQueryDto,
    createdAt: Prisma.DateTimeFilter,
  ): Prisma.AuditLogWhereInput {
    const and: Prisma.AuditLogWhereInput[] = [];
    if (query.tenantId) and.push({ tenantId: query.tenantId });
    if (query.action) and.push({ action: query.action });
    if (query.from || query.to) and.push({ createdAt });
    const status = normalizeStatus(query.status);
    if (status) and.push({ status: status.toUpperCase() });
    const search = normalizeOptionalString(query.search);
    if (search) {
      and.push({
        OR: [
          { tenantId: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
          { status: { contains: search, mode: 'insensitive' } },
          { userId: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { fullName: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }
    return and.length ? { AND: and } : {};
  }
}

function getPagination(query: Pick<PlatformListQueryDto, 'page' | 'limit'>) {
  const page = Math.max(query.page ?? DEFAULT_PLATFORM_PAGE, 1);
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_PLATFORM_LIMIT, 1), MAX_PLATFORM_LIMIT);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

function normalizeStatus(value: string | undefined) {
  const normalized = normalizeOptionalString(value)?.toLowerCase();
  return normalized && normalized !== 'all' ? normalized : undefined;
}

function toEnumValue<T extends Record<string, string>>(
  enumValues: T,
  value: string | undefined,
): T[keyof T] | undefined {
  const normalized = value?.toUpperCase();
  return (Object.values(enumValues) as Array<T[keyof T]>).find((item) => item === normalized);
}

function filterIncidents(incidents: PlatformIncident[], query: PlatformListQueryDto) {
  const tenantId = normalizeOptionalString(query.tenantId);
  const status = normalizeStatus(query.status);
  const search = normalizeOptionalString(query.search)?.toLowerCase();

  return incidents.filter((incident) => {
    if (tenantId && incident.tenantId !== tenantId) return false;
    if (status && incident.status.toLowerCase() !== status) return false;
    if (!search) return true;
    return [
      incident.id,
      incident.severity,
      incident.status,
      incident.title,
      incident.detail,
      incident.tenantId ?? '',
      String(incident.createdAt),
    ].some((value) => value.toLowerCase().includes(search));
  });
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
