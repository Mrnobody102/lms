import { Injectable } from '@nestjs/common';

export type RequestMetricGroup =
  | 'admin'
  | 'auth'
  | 'courses'
  | 'lessons'
  | 'progress'
  | 'users'
  | 'other';

interface RequestMetricBucket {
  count: number;
  totalDurationMs: number;
  maxDurationMs: number;
  statusCounts: Record<string, number>;
}

export interface RequestMetricsSnapshot {
  generatedAt: string;
  uptimeSeconds: number;
  totalRequests: number;
  totalErrors: number;
  readinessChecks: {
    ok: number;
    unhealthy: number;
    maxDurationMs: number;
    dependencies: Record<string, string>;
  };
  groups: Record<
    string,
    {
      count: number;
      errorCount: number;
      averageDurationMs: number;
      maxDurationMs: number;
      statusCounts: Record<string, number>;
    }
  >;
}

const PROMETHEUS_CONTENT_TYPE = 'text/plain; version=0.0.4; charset=utf-8';

@Injectable()
export class MetricsService {
  private readonly buckets = new Map<string, RequestMetricBucket>();
  private readonly readinessChecks = {
    ok: 0,
    unhealthy: 0,
    maxDurationMs: 0,
    dependencies: new Map<string, string>(),
  };

  recordRequest(input: {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
  }): void {
    const group = this.getRequestGroup(input.path);
    const statusClass = `${Math.floor(input.statusCode / 100)}xx`;
    const key = `${group}:${input.method.toUpperCase()}`;
    const bucket = this.buckets.get(key) ?? {
      count: 0,
      totalDurationMs: 0,
      maxDurationMs: 0,
      statusCounts: {},
    };

    bucket.count += 1;
    bucket.totalDurationMs += input.durationMs;
    bucket.maxDurationMs = Math.max(bucket.maxDurationMs, input.durationMs);
    bucket.statusCounts[statusClass] = (bucket.statusCounts[statusClass] ?? 0) + 1;

    this.buckets.set(key, bucket);
  }

  recordReadiness(input: {
    status: 'ok' | 'unhealthy';
    durationMs: number;
    checks?: Record<string, { status?: string }>;
  }): void {
    this.readinessChecks[input.status] += 1;
    this.readinessChecks.maxDurationMs = Math.max(
      this.readinessChecks.maxDurationMs,
      input.durationMs,
    );

    for (const [dependency, check] of Object.entries(input.checks ?? {})) {
      this.readinessChecks.dependencies.set(dependency, check.status ?? 'unknown');
    }
  }

  getSnapshot(): RequestMetricsSnapshot {
    const groups: RequestMetricsSnapshot['groups'] = {};
    let totalRequests = 0;
    let totalErrors = 0;

    Array.from(this.buckets.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .forEach(([key, bucket]) => {
        totalRequests += bucket.count;
        const errorCount = Object.entries(bucket.statusCounts).reduce(
          (sum, [statusClass, count]) =>
            statusClass === '4xx' || statusClass === '5xx' ? sum + count : sum,
          0,
        );
        totalErrors += errorCount;
        groups[key] = {
          count: bucket.count,
          errorCount,
          averageDurationMs: Math.round(bucket.totalDurationMs / bucket.count),
          maxDurationMs: bucket.maxDurationMs,
          statusCounts: { ...bucket.statusCounts },
        };
      });

    return {
      generatedAt: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      totalRequests,
      totalErrors,
      readinessChecks: {
        ok: this.readinessChecks.ok,
        unhealthy: this.readinessChecks.unhealthy,
        maxDurationMs: this.readinessChecks.maxDurationMs,
        dependencies: Object.fromEntries(
          Array.from(this.readinessChecks.dependencies.entries()).sort(([left], [right]) =>
            left.localeCompare(right),
          ),
        ),
      },
      groups,
    };
  }

  getPrometheusSnapshot(): string {
    const snapshot = this.getSnapshot();
    const lines = [
      '# HELP lms_http_requests_total Total HTTP requests observed by this API instance.',
      '# TYPE lms_http_requests_total counter',
    ];

    for (const [key, bucket] of Object.entries(snapshot.groups)) {
      const [group, method] = key.split(':');
      for (const [statusClass, count] of Object.entries(bucket.statusCounts)) {
        lines.push(
          `lms_http_requests_total{group="${this.escapeLabel(group)}",method="${this.escapeLabel(method)}",status_class="${this.escapeLabel(statusClass)}"} ${count}`,
        );
      }
    }

    lines.push(
      '# HELP lms_http_request_errors_total HTTP requests observed with 4xx or 5xx status classes.',
      '# TYPE lms_http_request_errors_total counter',
    );
    for (const [key, bucket] of Object.entries(snapshot.groups)) {
      const [group, method] = key.split(':');
      for (const [statusClass, count] of Object.entries(bucket.statusCounts)) {
        if (statusClass !== '4xx' && statusClass !== '5xx') {
          continue;
        }

        lines.push(
          `lms_http_request_errors_total{group="${this.escapeLabel(group)}",method="${this.escapeLabel(method)}",status_class="${this.escapeLabel(statusClass)}"} ${count}`,
        );
      }
    }

    lines.push(
      '# HELP lms_http_request_duration_ms_sum Sum of HTTP request durations observed by this API instance.',
      '# TYPE lms_http_request_duration_ms_sum counter',
    );
    for (const [key, bucket] of Array.from(this.buckets.entries()).sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      const [group, method] = key.split(':');
      lines.push(
        `lms_http_request_duration_ms_sum{group="${this.escapeLabel(group)}",method="${this.escapeLabel(method)}"} ${bucket.totalDurationMs}`,
      );
    }

    lines.push(
      '# HELP lms_http_request_duration_ms_max Max HTTP request duration observed by this API instance.',
      '# TYPE lms_http_request_duration_ms_max gauge',
    );
    for (const [key, bucket] of Object.entries(snapshot.groups)) {
      const [group, method] = key.split(':');
      lines.push(
        `lms_http_request_duration_ms_max{group="${this.escapeLabel(group)}",method="${this.escapeLabel(method)}"} ${bucket.maxDurationMs}`,
      );
    }

    lines.push(
      '# HELP lms_health_readiness_checks_total Readiness checks observed by this API instance.',
      '# TYPE lms_health_readiness_checks_total counter',
      `lms_health_readiness_checks_total{status="ok"} ${snapshot.readinessChecks.ok}`,
      `lms_health_readiness_checks_total{status="unhealthy"} ${snapshot.readinessChecks.unhealthy}`,
      '# HELP lms_health_readiness_duration_ms_max Max readiness check duration observed by this API instance.',
      '# TYPE lms_health_readiness_duration_ms_max gauge',
      `lms_health_readiness_duration_ms_max ${snapshot.readinessChecks.maxDurationMs}`,
      '# HELP lms_health_dependency_status Last observed readiness dependency status. Current status is 1.',
      '# TYPE lms_health_dependency_status gauge',
    );
    for (const [dependency, status] of Object.entries(snapshot.readinessChecks.dependencies)) {
      lines.push(
        `lms_health_dependency_status{dependency="${this.escapeLabel(dependency)}",status="${this.escapeLabel(status)}"} 1`,
      );
    }

    return `${lines.join('\n')}\n`;
  }

  reset(): void {
    this.buckets.clear();
    this.readinessChecks.ok = 0;
    this.readinessChecks.unhealthy = 0;
    this.readinessChecks.maxDurationMs = 0;
    this.readinessChecks.dependencies.clear();
  }

  private getRequestGroup(path: string): RequestMetricGroup {
    const normalizedPath = path.split('?')[0]?.replace(/^\/api(?=\/|$)/, '') ?? '';
    const firstSegment = normalizedPath.split('/').filter(Boolean)[0];

    switch (firstSegment) {
      case 'admin':
      case 'auth':
      case 'courses':
      case 'lessons':
      case 'progress':
      case 'users':
        return firstSegment;
      default:
        return 'other';
    }
  }

  private escapeLabel(value = ''): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}

export { PROMETHEUS_CONTENT_TYPE };
