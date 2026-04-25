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
}
