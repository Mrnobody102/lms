import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Tenant } from './use-tenants';

export interface SystemTelemetry {
  overview: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    totalLearningActivities: number;
  };
  runtime: {
    process: {
      pid: number;
      uptimeSeconds: number;
    };
    cpu: {
      cores: number;
      loadAverage1m: number;
      loadAverage5m: number;
      loadAverage15m: number;
    };
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
      externalMb: number;
    };
    prisma: {
      activeConnections: number | null;
    };
  };
  requestMetrics: {
    generatedAt: string;
    uptimeSeconds: number;
    totalRequests: number;
    totalErrors: number;
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
    tenantTraffic: Array<{
      tenantId: string;
      count: number;
      errorCount: number;
      averageDurationMs: number;
      maxDurationMs: number;
      lastSeenAt?: string;
    }>;
  };
  alerts: Array<{
    key: string;
    severity: 'warning' | 'critical';
    title: string;
    detail: string;
  }>;
  prometheus: {
    endpoint: string;
  };
  recentTenants: Pick<Tenant, 'id' | 'name' | 'slug' | 'isActive' | 'createdAt'>[];
}

export function useSystemTelemetry(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['system-telemetry'],
    queryFn: async () => {
      const response = await api.get<SystemTelemetry>('/admin/system/telemetry');
      return response.data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}
