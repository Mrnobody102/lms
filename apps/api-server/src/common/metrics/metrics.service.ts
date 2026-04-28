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
  groups: Record<
    string,
    {
      count: number;
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

  getSnapshot(): RequestMetricsSnapshot {
    const groups: RequestMetricsSnapshot['groups'] = {};
    let totalRequests = 0;

    Array.from(this.buckets.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .forEach(([key, bucket]) => {
        totalRequests += bucket.count;
        groups[key] = {
          count: bucket.count,
          averageDurationMs: Math.round(bucket.totalDurationMs / bucket.count),
          maxDurationMs: bucket.maxDurationMs,
          statusCounts: { ...bucket.statusCounts },
        };
      });

    return {
      generatedAt: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      totalRequests,
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

    return `${lines.join('\n')}\n`;
  }

  reset(): void {
    this.buckets.clear();
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
