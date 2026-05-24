import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cpus, loadavg } from 'os';
import { PrismaService } from '../common/services/prisma.service';
import { MetricsService, RequestMetricsSnapshot } from '../common/metrics/metrics.service';

interface SystemAlert {
  key: string;
  severity: 'warning' | 'critical';
  title: string;
  detail: string;
}

interface PrismaConnectionRow {
  count: number | bigint | string;
}

@Injectable()
export class AdminSystemService {
  private readonly lastAlertAt = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    private readonly configService: ConfigService,
  ) {}

  async getSystemTelemetry() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalCourses,
      totalEnrollments,
      totalLearningActivities,
      recentTenants,
      prismaConnections,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.course.count({ where: { deletedAt: null } }),
      this.prisma.courseEnrollment.count(),
      this.prisma.learningActivity.count(),
      this.prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.getPrismaConnectionCount(),
    ]);
    const requestMetrics = this.metrics.getSnapshot();
    const runtime = this.getRuntimeTelemetry(prismaConnections);
    const alerts = this.buildAlerts(requestMetrics, runtime);
    await this.dispatchAlerts(alerts);

    return {
      overview: {
        totalTenants,
        activeTenants,
        totalUsers,
        activeUsers,
        totalCourses,
        totalEnrollments,
        totalLearningActivities,
      },
      runtime,
      requestMetrics,
      alerts,
      prometheus: {
        endpoint: '/api/health/metrics/prometheus',
      },
      recentTenants,
    };
  }

  private getRuntimeTelemetry(prismaConnections: number | null) {
    const memory = process.memoryUsage();
    const toMb = (value: number) => Math.round(value / 1024 / 1024);
    const cpuCount = cpus().length || 1;

    return {
      process: {
        pid: process.pid,
        uptimeSeconds: Math.round(process.uptime()),
      },
      cpu: {
        cores: cpuCount,
        loadAverage1m: Number(loadavg()[0]?.toFixed(2) ?? 0),
        loadAverage5m: Number(loadavg()[1]?.toFixed(2) ?? 0),
        loadAverage15m: Number(loadavg()[2]?.toFixed(2) ?? 0),
      },
      memory: {
        rssMb: toMb(memory.rss),
        heapUsedMb: toMb(memory.heapUsed),
        heapTotalMb: toMb(memory.heapTotal),
        externalMb: toMb(memory.external),
      },
      prisma: {
        activeConnections: prismaConnections,
      },
    };
  }

  private async getPrismaConnectionCount() {
    try {
      const rows = await this.prisma.$queryRaw<PrismaConnectionRow[]>`
        SELECT count(*)::int AS count
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;
      const value = rows[0]?.count;
      return typeof value === 'bigint' ? Number(value) : Number(value ?? 0);
    } catch {
      return null;
    }
  }

  private buildAlerts(
    requestMetrics: RequestMetricsSnapshot,
    runtime: ReturnType<AdminSystemService['getRuntimeTelemetry']>,
  ): SystemAlert[] {
    const alerts: SystemAlert[] = [];
    const memoryThresholdMb = this.configService.get<number>('SYSTEM_ALERT_MEMORY_MB') ?? 1024;
    const latencyThresholdMs = this.configService.get<number>('SYSTEM_ALERT_LATENCY_MS') ?? 2000;
    const tenantRequestThreshold =
      this.configService.get<number>('SYSTEM_ALERT_TENANT_REQUESTS') ?? 500;

    if (runtime.memory.rssMb >= memoryThresholdMb) {
      alerts.push({
        key: 'memory-rss',
        severity: 'critical',
        title: 'High API memory usage',
        detail: `RSS memory is ${runtime.memory.rssMb}MB (threshold ${memoryThresholdMb}MB)`,
      });
    }

    const slowGroup = Object.entries(requestMetrics.groups).find(
      ([, group]) => group.maxDurationMs >= latencyThresholdMs,
    );
    if (slowGroup) {
      alerts.push({
        key: `latency-${slowGroup[0]}`,
        severity: 'warning',
        title: 'High API latency',
        detail: `${slowGroup[0]} reached ${slowGroup[1].maxDurationMs}ms`,
      });
    }

    const busiestTenant = requestMetrics.tenantTraffic[0];
    if (busiestTenant && busiestTenant.count >= tenantRequestThreshold) {
      alerts.push({
        key: `tenant-traffic-${busiestTenant.tenantId}`,
        severity: 'warning',
        title: 'Potential tenant request spike',
        detail: `${busiestTenant.tenantId} sent ${busiestTenant.count} requests on this API instance`,
      });
    }

    return alerts;
  }

  private async dispatchAlerts(alerts: SystemAlert[]) {
    const dueAlerts = alerts.filter((alert) => this.shouldDispatch(alert.key));
    if (dueAlerts.length === 0) {
      return;
    }

    const text = dueAlerts
      .map((alert) => `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.detail}`)
      .join('\n');

    await Promise.all([this.sendSlackAlert(text), this.sendTelegramAlert(text)]);
    const dispatchedAt = Date.now();
    for (const alert of dueAlerts) {
      this.lastAlertAt.set(alert.key, dispatchedAt);
    }
  }

  private shouldDispatch(key: string) {
    const cooldownMs = 10 * 60 * 1000;
    const lastAlertAt = this.lastAlertAt.get(key) ?? 0;
    return Date.now() - lastAlertAt > cooldownMs;
  }

  private async sendSlackAlert(text: string) {
    const webhookUrl = this.configService.get<string>('SLACK_ALERT_WEBHOOK_URL');
    if (!webhookUrl) {
      return;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    }).catch(() => undefined);
  }

  private async sendTelegramAlert(text: string) {
    const botToken = this.configService.get<string>('TELEGRAM_ALERT_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_ALERT_CHAT_ID');
    if (!botToken || !chatId) {
      return;
    }

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }).catch(() => undefined);
  }
}
