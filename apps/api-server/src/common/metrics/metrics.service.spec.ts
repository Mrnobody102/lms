import { describe, expect, it } from 'vitest';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('should aggregate request counts, status classes, and duration by endpoint group and method', () => {
    const service = new MetricsService();

    service.recordRequest({
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 200,
      durationMs: 20,
    });
    service.recordRequest({
      method: 'POST',
      path: '/auth/login',
      statusCode: 401,
      durationMs: 40,
    });
    service.recordRequest({
      method: 'GET',
      path: '/api/courses?page=1',
      statusCode: 200,
      durationMs: 15,
    });

    const snapshot = service.getSnapshot();

    expect(snapshot.totalRequests).toBe(3);
    expect(snapshot.groups['auth:POST']).toEqual({
      count: 2,
      averageDurationMs: 30,
      maxDurationMs: 40,
      statusCounts: {
        '2xx': 1,
        '4xx': 1,
      },
    });
    expect(snapshot.groups['courses:GET']).toEqual({
      count: 1,
      averageDurationMs: 15,
      maxDurationMs: 15,
      statusCounts: {
        '2xx': 1,
      },
    });
  });
});
