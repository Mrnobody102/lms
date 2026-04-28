import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const createController = (readinessStatus: 'ok' | 'unhealthy') => {
    const healthService = {
      getReadiness: vi.fn().mockResolvedValue({
        status: readinessStatus,
        checks: {},
      }),
      getLiveness: vi.fn(),
      getDocs: vi.fn(),
    };
    const metricsService = {
      getSnapshot: vi.fn(),
      getPrometheusSnapshot: vi.fn(),
      recordReadiness: vi.fn(),
    };

    return {
      controller: new HealthController(healthService as never, metricsService as never),
      healthService,
      metricsService,
    };
  };

  it('should keep readiness probes HTTP 200 when dependencies are healthy', async () => {
    const { controller, metricsService } = createController('ok');
    const response = { status: vi.fn() };

    await expect(controller.getReadiness(response as never)).resolves.toEqual({
      status: 'ok',
      checks: {},
    });

    expect(response.status).not.toHaveBeenCalled();
    expect(metricsService.recordReadiness).toHaveBeenCalledWith({
      status: 'ok',
      durationMs: expect.any(Number),
      checks: {},
    });
  });

  it('should return HTTP 503 when readiness dependencies are unhealthy', async () => {
    const { controller } = createController('unhealthy');
    const response = { status: vi.fn() };

    await expect(controller.getReadiness(response as never)).resolves.toEqual({
      status: 'unhealthy',
      checks: {},
    });

    expect(response.status).toHaveBeenCalledWith(503);
  });

  it('should apply the same readiness status to the backward-compatible health alias', async () => {
    const { controller } = createController('unhealthy');
    const response = { status: vi.fn() };

    await controller.check(response as never);

    expect(response.status).toHaveBeenCalledWith(503);
  });
});
