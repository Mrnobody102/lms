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
    expect(snapshot.totalErrors).toBe(1);
    expect(snapshot.groups['auth:POST']).toEqual({
      count: 2,
      errorCount: 1,
      averageDurationMs: 30,
      maxDurationMs: 40,
      statusCounts: {
        '2xx': 1,
        '4xx': 1,
      },
    });
    expect(snapshot.groups['courses:GET']).toEqual({
      count: 1,
      errorCount: 0,
      averageDurationMs: 15,
      maxDurationMs: 15,
      statusCounts: {
        '2xx': 1,
      },
    });
  });

  it('should expose request metrics in Prometheus text format', () => {
    const service = new MetricsService();

    service.recordRequest({
      method: 'GET',
      path: '/api/courses',
      statusCode: 200,
      durationMs: 25,
    });
    service.recordRequest({
      method: 'GET',
      path: '/api/courses',
      statusCode: 500,
      durationMs: 30,
    });
    service.recordReadiness({
      status: 'unhealthy',
      durationMs: 12,
      checks: {
        database: { status: 'down' },
        redis: { status: 'skipped' },
      },
    });

    const output = service.getPrometheusSnapshot();

    expect(output).toContain('# TYPE lms_http_requests_total counter');
    expect(output).toContain(
      'lms_http_requests_total{group="courses",method="GET",status_class="2xx"} 1',
    );
    expect(output).toContain(
      'lms_http_request_errors_total{group="courses",method="GET",status_class="5xx"} 1',
    );
    expect(output).toContain('lms_http_request_duration_ms_sum{group="courses",method="GET"} 55');
    expect(output).toContain('lms_http_request_duration_ms_max{group="courses",method="GET"} 30');
    expect(output).toContain('lms_health_readiness_checks_total{status="unhealthy"} 1');
    expect(output).toContain('lms_health_dependency_status{dependency="database",status="down"} 1');
  });
});
