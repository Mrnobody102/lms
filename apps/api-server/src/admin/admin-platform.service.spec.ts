import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BillingPlanStatus,
  InvoiceStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '@repo/database';
import { AuditAction, AuditStatus } from '../common/services/audit-log.service';
import { AdminPlatformService } from './admin-platform.service';

function createService(prismaOverrides: Record<string, unknown> = {}) {
  const prisma = {
    tenant: {
      count: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: { count: vi.fn() },
    course: { count: vi.fn() },
    courseEnrollment: { count: vi.fn() },
    lesson: { count: vi.fn() },
    mediaAsset: { aggregate: vi.fn(), groupBy: vi.fn() },
    tenantSubscription: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    billingPlan: { count: vi.fn(), findMany: vi.fn() },
    invoice: { count: vi.fn(), findMany: vi.fn() },
    payment: { count: vi.fn(), findMany: vi.fn() },
    usageLedger: { aggregate: vi.fn(), groupBy: vi.fn() },
    auditLog: { count: vi.fn(), findMany: vi.fn() },
    ...prismaOverrides,
  };
  const metrics = {
    getSnapshot: vi.fn().mockReturnValue({
      generatedAt: '2026-05-31T00:00:00.000Z',
      tenantTraffic: [],
      groups: {},
      totalRequests: 0,
      totalErrors: 0,
      uptimeSeconds: 1,
    }),
  };
  const auditLog = { log: vi.fn() };

  return {
    prisma,
    metrics,
    auditLog,
    service: new AdminPlatformService(prisma as never, metrics as never, auditLog as never),
  };
}

describe('AdminPlatformService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds tenant overview from tenant-scoped aggregates', async () => {
    const { prisma, service } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant One',
      slug: 'tenant-one',
      domain: 'tenant.example.com',
      settings: { features: { aiTutorEnabled: true } },
      isActive: true,
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
      updatedAt: new Date('2026-05-02T00:00:00.000Z'),
    });
    prisma.user.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8);
    prisma.course.count.mockResolvedValue(4);
    prisma.courseEnrollment.count.mockResolvedValue(12);
    prisma.lesson.count.mockResolvedValue(20);
    prisma.mediaAsset.aggregate.mockResolvedValue({
      _count: { _all: 3 },
      _sum: { sizeBytes: 1024 },
    });
    prisma.tenantSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      status: SubscriptionStatus.ACTIVE,
      plan: { id: 'plan-1', name: 'Pro', code: 'pro' },
      storageQuotaBytes: BigInt(2048),
      aiRequestQuota: 1000,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });
    prisma.auditLog.findMany.mockResolvedValue([]);

    const result = await service.getTenantOverview('tenant-1');

    expect(result.counts).toEqual({
      users: 10,
      activeUsers: 8,
      courses: 4,
      enrollments: 12,
      lessons: 20,
      mediaAssets: 3,
      mediaStorageBytes: 1024,
    });
    expect(result.readiness.hasActiveSubscription).toBe(true);
    expect(result.readiness.featureFlags.aiTutorEnabled).toBe(true);
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null },
    });
    expect(prisma.course.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null },
    });
  });

  it('reads legacy feature flags and writes canonical featureFlags settings', async () => {
    const { auditLog, prisma, service } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant One',
      slug: 'tenant-one',
      isActive: true,
      settings: { features: { activationCodesEnabled: true } },
    });
    prisma.tenant.update.mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant One',
      slug: 'tenant-one',
      isActive: true,
      settings: {
        features: { activationCodesEnabled: true },
        featureFlags: { activationCodesEnabled: true, roleplayEnabled: true },
      },
    });

    const result = await service.updateFeatureFlags('tenant-1', { roleplayEnabled: true }, {
      id: 'super-1',
    } as never);

    expect(result.featureFlags.activationCodesEnabled).toBe(true);
    expect(result.featureFlags.roleplayEnabled).toBe(true);
    expect(prisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          settings: expect.objectContaining({
            featureFlags: expect.objectContaining({ roleplayEnabled: true }),
          }),
        }),
      }),
    );
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        action: AuditAction.PLATFORM_FEATURE_FLAGS_UPDATE,
        status: AuditStatus.SUCCESS,
      }),
    );
  });

  it('updates subscription quotas and writes audit log', async () => {
    const { auditLog, prisma, service } = createService();
    prisma.tenantSubscription.findUnique.mockResolvedValue({ id: 'sub-1', tenantId: 'tenant-1' });
    prisma.tenantSubscription.update.mockResolvedValue({
      id: 'sub-1',
      tenantId: 'tenant-1',
      tenant: { id: 'tenant-1', name: 'Tenant One', slug: 'tenant-one' },
      plan: { id: 'plan-1', name: 'Pro', code: 'pro' },
      status: SubscriptionStatus.PAST_DUE,
      storageQuotaBytes: BigInt(4096),
      aiRequestQuota: 200,
    });

    const result = await service.updateSubscription(
      'sub-1',
      {
        status: SubscriptionStatus.PAST_DUE,
        storageQuotaBytes: '4096',
        aiRequestQuota: 200,
      },
      { id: 'super-1' } as never,
    );

    expect(result.storageQuotaBytes).toBe('4096');
    expect(prisma.tenantSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SubscriptionStatus.PAST_DUE,
          storageQuotaBytes: BigInt(4096),
          aiRequestQuota: 200,
        }),
      }),
    );
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        action: AuditAction.PLATFORM_SUBSCRIPTION_UPDATE,
        status: AuditStatus.SUCCESS,
      }),
    );
  });

  it('paginates usage rows, caps large limits, and filters tenant status/search', async () => {
    const { metrics, prisma, service } = createService();
    prisma.tenant.findMany.mockResolvedValue([
      { id: 'tenant-1', name: 'North Campus', slug: 'north-campus', isActive: true },
    ]);
    prisma.tenant.count.mockResolvedValue(150);
    prisma.mediaAsset.groupBy.mockResolvedValue([
      { tenantId: 'tenant-1', _count: { _all: 2 }, _sum: { sizeBytes: 4096 } },
    ]);
    prisma.usageLedger.groupBy.mockResolvedValue([
      {
        tenantId: 'tenant-1',
        type: 'MEDIA_UPLOAD',
        unit: 'bytes',
        _sum: { quantity: BigInt(4096) },
      },
    ]);
    metrics.getSnapshot.mockReturnValue({
      generatedAt: '2026-05-31T00:00:00.000Z',
      tenantTraffic: [
        {
          tenantId: 'tenant-1',
          count: 42,
          errorCount: 1,
          averageDurationMs: 35,
          maxDurationMs: 120,
          lastSeenAt: '2026-05-31T00:00:00.000Z',
        },
      ],
      groups: {},
      totalRequests: 42,
      totalErrors: 1,
      uptimeSeconds: 1,
    });

    const result = await service.getUsage({
      limit: 10_000,
      search: 'North',
      status: 'active',
    });

    expect(result.meta).toEqual({ page: 1, limit: 100, total: 150, totalPages: 2 });
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        mediaAssets: 2,
        mediaStorageBytes: 4096,
        ledger: [{ type: 'MEDIA_UPLOAD', unit: 'bytes', quantity: '4096' }],
      }),
    );
    expect(prisma.tenant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 100,
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { isActive: true },
            expect.objectContaining({ OR: expect.any(Array) }),
          ]),
        }),
      }),
    );
    expect(prisma.mediaAsset.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: { in: ['tenant-1'] } } }),
    );
  });

  it('returns paginated AI usage without exposing provider keys', async () => {
    vi.stubEnv('AI_PROVIDER', 'groq');
    vi.stubEnv('GROQ_API_KEY', 'secret-key');
    vi.stubEnv('GROQ_MODEL', 'llama-test');
    const { prisma, service } = createService();
    prisma.tenant.findMany.mockResolvedValue([
      { id: 'tenant-1', name: 'North Campus', slug: 'north-campus', isActive: true },
    ]);
    prisma.tenant.count.mockResolvedValue(1);
    prisma.tenantSubscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        tenantId: 'tenant-1',
        status: SubscriptionStatus.ACTIVE,
        aiRequestQuota: 100,
        startsAt: new Date('2026-06-01T00:00:00.000Z'),
        endsAt: null,
        currentPeriodStart: new Date('2026-06-01T00:00:00.000Z'),
        currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ]);
    prisma.usageLedger.groupBy.mockResolvedValue([
      {
        tenantId: 'tenant-1',
        _max: { occurredAt: new Date('2026-06-09T00:00:00.000Z') },
        _sum: { quantity: BigInt(4) },
      },
    ]);
    prisma.usageLedger.aggregate.mockResolvedValue({ _sum: { quantity: BigInt(4) } });

    const result = await service.getAiUsage({ page: 1, limit: 10 });

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          configured: true,
          model: 'llama-test',
          periodRemaining: 96,
          periodUsed: 4,
          provider: 'groq',
          quotaConfigured: true,
          subscriptionQuota: 100,
          tenant: expect.objectContaining({ id: 'tenant-1' }),
        }),
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(JSON.stringify(result)).not.toContain('secret-key');
  });

  it('paginates billing lists and applies tenant, search, and status filters', async () => {
    const { prisma, service } = createService();
    prisma.billingPlan.findMany.mockResolvedValue([
      {
        id: 'plan-1',
        tenantId: 'tenant-1',
        tenant: { id: 'tenant-1', name: 'North Campus', slug: 'north-campus' },
        name: 'Pro',
        code: 'pro',
        status: BillingPlanStatus.ACTIVE,
        storageQuotaBytes: BigInt(2048),
        aiRequestQuota: 1000,
      },
    ]);
    prisma.billingPlan.count.mockResolvedValue(1);
    prisma.tenantSubscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        tenantId: 'tenant-1',
        tenant: { id: 'tenant-1', name: 'North Campus', slug: 'north-campus' },
        plan: { id: 'plan-1', name: 'Pro', code: 'pro' },
        status: SubscriptionStatus.ACTIVE,
        storageQuotaBytes: BigInt(2048),
        aiRequestQuota: 1000,
      },
    ]);
    prisma.tenantSubscription.count.mockResolvedValue(1);
    prisma.invoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        tenantId: 'tenant-1',
        tenant: { id: 'tenant-1', name: 'North Campus', slug: 'north-campus' },
        number: 'INV-1',
        status: InvoiceStatus.PAID,
        currency: 'USD',
        totalMinor: 1000,
      },
    ]);
    prisma.invoice.count.mockResolvedValue(1);
    prisma.payment.findMany.mockResolvedValue([
      {
        id: 'payment-1',
        tenantId: 'tenant-1',
        tenant: { id: 'tenant-1', name: 'North Campus', slug: 'north-campus' },
        status: PaymentStatus.SUCCEEDED,
        provider: 'manual',
        currency: 'USD',
        amountMinor: 1000,
      },
    ]);
    prisma.payment.count.mockResolvedValue(1);

    const result = await service.getBilling({
      tenantId: 'tenant-1',
      search: 'pro',
      status: 'active',
      limit: 10_000,
    });

    expect(result.summary).toEqual({ plans: 1, subscriptions: 1, invoices: 1, payments: 1 });
    expect(result.plans.meta.limit).toBe(100);
    expect(result.plans.items[0].storageQuotaBytes).toBe('2048');
    expect(result.subscriptions.items[0].storageQuotaBytes).toBe('2048');
    expect(prisma.tenantSubscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 100,
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { tenantId: 'tenant-1' },
            { status: SubscriptionStatus.ACTIVE },
          ]),
        }),
      }),
    );
  });

  it('paginates audit logs and applies action, status, date, and search filters', async () => {
    const { prisma, service } = createService();
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'audit-1',
        tenantId: 'tenant-1',
        action: AuditAction.PLATFORM_FEATURE_FLAGS_UPDATE,
        status: AuditStatus.FAILURE,
        userId: 'super-1',
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ]);
    prisma.auditLog.count.mockResolvedValue(201);

    const result = await service.getAuditLogs({
      action: AuditAction.PLATFORM_FEATURE_FLAGS_UPDATE,
      from: '2026-06-01T00:00:00.000Z',
      limit: 10_000,
      page: 2,
      search: 'super',
      status: 'failure',
    });

    expect(result.meta).toEqual({ page: 2, limit: 100, total: 201, totalPages: 3 });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 100,
        take: 100,
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { action: AuditAction.PLATFORM_FEATURE_FLAGS_UPDATE },
            { status: AuditStatus.FAILURE },
            expect.objectContaining({ createdAt: expect.any(Object) }),
            expect.objectContaining({ OR: expect.any(Array) }),
          ]),
        }),
      }),
    );
  });

  it('paginates incidents from bounded real alert signals', async () => {
    const { metrics, prisma, service } = createService();
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'audit-1',
        tenantId: 'tenant-2',
        action: AuditAction.PLATFORM_SUBSCRIPTION_UPDATE,
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ]);
    metrics.getSnapshot.mockReturnValue({
      generatedAt: '2026-06-01T00:00:00.000Z',
      tenantTraffic: [
        {
          tenantId: 'tenant-1',
          count: 50,
          errorCount: 3,
          averageDurationMs: 40,
          maxDurationMs: 200,
          lastSeenAt: '2026-06-01T00:00:00.000Z',
        },
      ],
      groups: {},
      totalRequests: 50,
      totalErrors: 3,
      uptimeSeconds: 1,
    });

    const result = await service.getIncidents({
      limit: 1,
      search: 'tenant-1',
      status: 'monitoring',
    });

    expect(result.meta).toEqual({ page: 1, limit: 1, total: 1, totalPages: 1 });
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 'tenant-errors-tenant-1',
        tenantId: 'tenant-1',
        status: 'monitoring',
      }),
    );
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });

  it('reports env-managed Groq AI status without exposing the API key', () => {
    vi.stubEnv('AI_PROVIDER', 'groq');
    vi.stubEnv('GROQ_API_KEY', 'gsk_test_secret_value');
    vi.stubEnv('GROQ_MODEL', 'llama-3.1-8b-instant');

    const { service } = createService();

    expect(service.getAiStatus()).toEqual({
      mode: 'env-managed',
      provider: 'groq',
      configured: true,
      health: 'configured',
      model: 'llama-3.1-8b-instant',
      timeoutMs: 15000,
      maxRetries: 1,
      dynamicConfigEnabled: false,
      keyStorage: 'render-env',
      keyMasked: 'configured',
      frontendExposureAllowed: false,
    });
  });
});
