'use client';

import {
  Activity,
  AlertTriangle,
  BookOpen,
  Cpu,
  Database,
  Gauge,
  GraduationCap,
  HardDrive,
  Server,
  Users,
} from 'lucide-react';
import { useSystemTelemetry, type SystemTelemetry } from '@/hooks/use-system-telemetry';
import { useTranslations } from 'next-intl';

export function SystemTelemetryDashboard() {
  const t = useTranslations('SuperPortal');
  const { data: telemetry, isLoading } = useSystemTelemetry();

  if (isLoading || !telemetry) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card h-28 rounded-xl border border-border"></div>
        ))}
      </div>
    );
  }

  const { overview } = telemetry;
  const busiestTenant = telemetry.requestMetrics.tenantTraffic[0];

  const stats = [
    {
      label: t('stats.users'),
      value: overview.totalUsers.toLocaleString(),
      subValue: t('stats.activeValue', { count: overview.activeUsers }),
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: t('stats.courses'),
      value: overview.totalCourses.toLocaleString(),
      subValue: t('stats.totalCreated'),
      icon: BookOpen,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: t('stats.enrollments'),
      value: overview.totalEnrollments.toLocaleString(),
      subValue: t('stats.activeEnrollments'),
      icon: GraduationCap,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: t('stats.activities'),
      value: overview.totalLearningActivities.toLocaleString(),
      subValue: t('stats.trackedEvents'),
      icon: Activity,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  const infraStats = [
    {
      label: t('system.cpuLoad'),
      value: telemetry.runtime.cpu.loadAverage1m.toFixed(2),
      subValue: t('system.cpuCores', { count: telemetry.runtime.cpu.cores }),
      icon: Cpu,
    },
    {
      label: t('system.memory'),
      value: `${telemetry.runtime.memory.rssMb} MB`,
      subValue: t('system.heap', {
        used: telemetry.runtime.memory.heapUsedMb,
        total: telemetry.runtime.memory.heapTotalMb,
      }),
      icon: HardDrive,
    },
    {
      label: t('system.prismaConnections'),
      value: telemetry.runtime.prisma.activeConnections?.toLocaleString() ?? t('system.unknown'),
      subValue: t('system.databasePool'),
      icon: Database,
    },
    {
      label: t('system.apiLatency'),
      value: `${maxLatencyMs(telemetry.requestMetrics.groups)} ms`,
      subValue: t('system.requests', { count: telemetry.requestMetrics.totalRequests }),
      icon: Gauge,
    },
  ];

  return (
    <div className="space-y-6 mb-10">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-primary" />
          {t('systemTelemetry')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {infraStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <stat.icon className="h-4 w-4 text-primary" />
              {stat.label}
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{stat.subValue}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Gauge className="h-4 w-4 text-primary" />
            {t('system.tenantTraffic')}
          </div>
          {busiestTenant ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">{busiestTenant.tenantId}</span>
                <span className="text-muted-foreground">
                  {t('system.requests', { count: busiestTenant.count })}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {t('system.errorsAndLatency', {
                  errors: busiestTenant.errorCount,
                  latency: busiestTenant.maxDurationMs,
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{t('system.noTenantTraffic')}</div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t('system.alerts')}
          </div>
          {telemetry.alerts.length > 0 ? (
            <div className="space-y-2">
              {telemetry.alerts.map((alert) => (
                <div key={alert.key} className="rounded-md bg-muted/40 p-2 text-sm">
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-xs text-muted-foreground">{alert.detail}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{t('system.noAlerts')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function maxLatencyMs(groups: SystemTelemetry['requestMetrics']['groups']) {
  return Object.values(groups).reduce((max, group) => Math.max(max, group.maxDurationMs), 0);
}
