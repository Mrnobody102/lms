import { ForbiddenException, HttpException } from '@nestjs/common';
import { SubscriptionStatus } from '@repo/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditAction, AuditStatus } from '../common/services/audit-log.service';
import { AI_FEATURE_KEYS, AI_PROMPT_VERSIONS } from './ai-governance.constants';
import { AiGovernanceService } from './ai-governance.service';

function createService() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const prisma = {
    aiUsageQuota: {
      create: vi.fn().mockResolvedValue({
        requestsUsed: 0,
        requestLimit: 50,
        resetAt: tomorrow,
      }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({
        requestsUsed: 1,
        requestLimit: 50,
        resetAt: tomorrow,
      }),
    },
    tenant: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'tenant-1',
        isActive: true,
        settings: { featureFlags: { aiTutorEnabled: true } },
      }),
    },
    tenantSubscription: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    usageLedger: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: BigInt(0) } }),
      create: vi.fn().mockResolvedValue({ id: 'ledger-1' }),
    },
  };
  const aiGateway = {
    getRuntimeConfig: vi.fn().mockReturnValue({
      provider: 'groq',
      configured: true,
      enabled: true,
      model: 'llama-test',
    }),
  };
  const auditLog = { log: vi.fn().mockResolvedValue(undefined) };

  return {
    auditLog,
    prisma,
    service: new AiGovernanceService(prisma as never, aiGateway as never, auditLog as never),
  };
}

function governanceInput() {
  return {
    tenantId: 'tenant-1',
    userId: 'user-1',
    role: 'STUDENT',
    feature: AI_FEATURE_KEYS.tutorExplain,
    promptVersion: AI_PROMPT_VERSIONS.tutorExplain,
  };
}

describe('AiGovernanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows compatibility fallback when no subscription exists', async () => {
    const { prisma, service } = createService();

    await expect(service.withGovernance(governanceInput(), async () => 'ok')).resolves.toBe('ok');

    expect(prisma.tenantSubscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
    );
    expect(prisma.aiUsageQuota.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ requestLimit: 50 }) }),
    );
    expect(prisma.usageLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          sourceType: AI_FEATURE_KEYS.tutorExplain,
          metadata: expect.objectContaining({
            quotaConfigured: false,
            status: AuditStatus.SUCCESS,
          }),
        }),
      }),
    );
  });

  it('keeps AI enabled for tenants without an explicit feature flag', async () => {
    const { prisma, service } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      isActive: true,
      settings: {},
    });

    await expect(service.withGovernance(governanceInput(), async () => 'ok')).resolves.toBe('ok');
  });

  it('blocks disabled tenant AI feature flags with 403', async () => {
    const { prisma, service } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      isActive: true,
      settings: { featureFlags: { aiTutorEnabled: false } },
    });

    await expect(
      service.withGovernance(governanceInput(), async () => 'ok'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('enforces user daily quota with 429 and audit metadata', async () => {
    const { auditLog, prisma, service } = createService();
    prisma.aiUsageQuota.findUnique.mockResolvedValue({
      requestsUsed: 50,
      requestLimit: 50,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await expectTooManyRequests(service.withGovernance(governanceInput(), async () => 'ok'));

    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.AI_QUOTA_DENIED,
        status: AuditStatus.FAILURE,
        metadata: expect.objectContaining({ reason: 'user_daily_quota_exhausted' }),
      }),
    );
  });

  it('enforces tenant subscription period quota with 429', async () => {
    const { auditLog, prisma, service } = createService();
    prisma.tenantSubscription.findFirst.mockResolvedValue({
      aiRequestQuota: 1,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
      currentPeriodStart: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: null,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      status: SubscriptionStatus.ACTIVE,
    });
    prisma.usageLedger.aggregate.mockResolvedValue({ _sum: { quantity: BigInt(1) } });

    await expectTooManyRequests(service.withGovernance(governanceInput(), async () => 'ok'));

    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.AI_QUOTA_DENIED,
        metadata: expect.objectContaining({ reason: 'tenant_period_quota_exhausted' }),
      }),
    );
    expect(prisma.aiUsageQuota.update).not.toHaveBeenCalled();
  });

  it('writes failure ledger metadata and provider audit when the provider fails', async () => {
    const { auditLog, prisma, service } = createService();

    await expect(
      service.withGovernance(governanceInput(), async () => {
        throw new Error('provider down');
      }),
    ).rejects.toThrow('provider down');

    expect(prisma.usageLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            error: 'provider down',
            failureCategory: 'unknown',
            retryable: false,
            status: AuditStatus.FAILURE,
          }),
        }),
      }),
    );
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.AI_PROVIDER_FAILURE,
        status: AuditStatus.FAILURE,
        metadata: expect.objectContaining({
          failureCategory: 'unknown',
          retryable: false,
        }),
      }),
    );
  });
});

async function expectTooManyRequests(promise: Promise<unknown>): Promise<void> {
  try {
    await promise;
    throw new Error('Expected request to be rejected');
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
  }
}
