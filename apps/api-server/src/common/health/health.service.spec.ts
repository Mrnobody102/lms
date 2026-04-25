import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let prisma: { $queryRaw: ReturnType<typeof vi.fn> };
  let service: HealthService;

  beforeEach(() => {
    prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    service = new HealthService(prisma as never);
  });

  it('should report liveness without dependencies', () => {
    const result = service.getLiveness();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'api-server',
      }),
    );
  });

  it('should report readiness with database up and redis skipped when REDIS_URL is missing', async () => {
    const originalRedisUrl = process.env.REDIS_URL;
    delete process.env.REDIS_URL;

    const result = await service.getReadiness();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        checks: expect.objectContaining({
          database: expect.objectContaining({ status: 'up' }),
          redis: expect.objectContaining({ status: 'skipped' }),
        }),
      }),
    );

    process.env.REDIS_URL = originalRedisUrl;
  });

  it('should expose human-readable health endpoint docs separately from monitoring probes', () => {
    const result = service.getDocs();

    expect(result.endpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/api/health/ready',
          audience: 'monitoring',
        }),
        expect.objectContaining({
          path: '/api/health/docs',
          audience: 'human',
        }),
      ]),
    );
  });
});
