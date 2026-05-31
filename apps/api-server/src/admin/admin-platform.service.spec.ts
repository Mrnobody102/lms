import { describe, expect, it, vi } from 'vitest';
import { SubscriptionStatus } from '@repo/database';
import { AuditAction, AuditStatus } from '../common/services/audit-log.service';
import { AdminPlatformService } from './admin-platform.service';

function createService(prismaOverrides: Record<string, unknown> = {}) {
  const prisma = {
    tenant: {
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
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    billingPlan: { findMany: vi.fn() },
    invoice: { findMany: vi.fn() },
    payment: { findMany: vi.fn() },
    usageLedger: { groupBy: vi.fn() },
    auditLog: { findMany: vi.fn() },
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
});
