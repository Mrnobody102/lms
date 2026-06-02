'use client';

import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  CreditCard,
  Database,
  Flag,
  Globe2,
  HardDrive,
  ListChecks,
  LockKeyhole,
  ServerCog,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  EmptyState as SharedEmptyState,
  ErrorState as SharedErrorState,
  LoadingState,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { PortalSidebar } from '@/components/layout/portal-sidebar';
import { LoginModal } from '@/features/auth/components/login-modal';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  PlatformFeatureFlagRow,
  PlatformUsageRow,
  usePlatformAuditLogs,
  usePlatformAiStatus,
  usePlatformBilling,
  usePlatformDomains,
  usePlatformFeatureFlags,
  usePlatformIncidents,
  usePlatformUsage,
  useUpdatePlatformFeatureFlags,
} from '@/hooks/use-platform';
import { useSystemTelemetry } from '@/hooks/use-system-telemetry';

export type OpsPageKind =
  | 'plansBilling'
  | 'usageStorage'
  | 'domains'
  | 'featureFlags'
  | 'incidents'
  | 'auditLogs'
  | 'aiSettings'
  | 'infrastructure';

const PAGE_CONFIG: Record<OpsPageKind, { icon: LucideIcon; tone: string }> = {
  plansBilling: { icon: CreditCard, tone: 'bg-emerald-500/10 text-emerald-600' },
  usageStorage: { icon: HardDrive, tone: 'bg-blue-500/10 text-blue-600' },
  domains: { icon: Globe2, tone: 'bg-cyan-500/10 text-cyan-600' },
  featureFlags: { icon: Flag, tone: 'bg-violet-500/10 text-violet-600' },
  incidents: { icon: ListChecks, tone: 'bg-amber-500/10 text-amber-600' },
  auditLogs: { icon: Database, tone: 'bg-slate-500/10 text-slate-600' },
  aiSettings: { icon: Bot, tone: 'bg-fuchsia-500/10 text-fuchsia-600' },
  infrastructure: { icon: ServerCog, tone: 'bg-indigo-500/10 text-indigo-600' },
};

export function PortalOpsPage({ kind }: { kind: OpsPageKind }) {
  const t = useTranslations('SuperPortal.ops');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const config = PAGE_CONFIG[kind];
  const Icon = config.icon;

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <ServerCog className="mb-4 h-10 w-10 animate-pulse text-primary" />
        <p className="font-medium text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="flex">
        <PortalSidebar />
        <main className="mx-auto w-full max-w-7xl p-4 text-foreground sm:p-6 lg:p-8">
          <div className="mb-6 flex min-w-0 items-start gap-4">
            <div className={`mt-1 rounded-xl p-3 ${config.tone}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t('eyebrow')}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {t(`${kind}.title`)}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {t(`${kind}.desc`)}
              </p>
            </div>
          </div>

          {!isAuthenticated ? <LockedState /> : <OpsContent kind={kind} />}
        </main>
      </div>
      {!isAuthenticated && <LoginModal />}
      <Footer />
    </div>
  );
}

function LockedState() {
  const t = useTranslations('SuperPortal.ops');
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <LockKeyhole className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold">{t('lockedTitle')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('lockedDesc')}</p>
    </div>
  );
}

function OpsContent({ kind }: { kind: OpsPageKind }) {
  if (kind === 'plansBilling') return <PlansBilling />;
  if (kind === 'usageStorage') return <UsageStorage />;
  if (kind === 'domains') return <Domains />;
  if (kind === 'featureFlags') return <FeatureFlags />;
  if (kind === 'incidents') return <Incidents />;
  if (kind === 'auditLogs') return <AuditLogs />;
  if (kind === 'aiSettings') return <AiSettings />;
  return <Infrastructure />;
}

function PlansBilling() {
  const t = useTranslations('SuperPortal.ops');
  const { data, isLoading, isError } = usePlatformBilling();

  if (isLoading) return <LoadingGrid />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={CreditCard}
          label={t('plansBilling.plans')}
          value={data.plans.length.toLocaleString()}
          helper={t('plansBilling.realData')}
        />
        <SummaryCard
          icon={CheckCircle2}
          label={t('plansBilling.subscriptions')}
          value={data.subscriptions.length.toLocaleString()}
          helper={t('plansBilling.realData')}
        />
        <SummaryCard
          icon={Database}
          label={t('plansBilling.invoices')}
          value={data.invoices.length.toLocaleString()}
          helper={t('plansBilling.realData')}
        />
      </div>
      <DataTable
        title={t('plansBilling.subscriptionTitle')}
        empty={t('empty')}
        headers={[t('tenant'), t('plan'), t('statusLabel'), t('quota')]}
        rows={data.subscriptions.map((subscription) => [
          subscription.tenant.name,
          subscription.plan.name,
          subscription.status,
          formatBytesString(subscription.storageQuotaBytes),
        ])}
      />
      <DataTable
        title={t('plansBilling.invoiceTitle')}
        empty={t('empty')}
        headers={[t('tenant'), t('invoice'), t('amount'), t('statusLabel')]}
        rows={data.invoices.map((invoice) => [
          invoice.tenant.name,
          invoice.number,
          formatMoney(invoice.totalMinor, invoice.currency),
          invoice.status,
        ])}
      />
    </div>
  );
}

function UsageStorage() {
  const t = useTranslations('SuperPortal.ops');
  const { data = [], isLoading, isError } = usePlatformUsage();
  const totalStorage = data.reduce((sum, row) => sum + row.mediaStorageBytes, 0);
  const totalRequests = data.reduce((sum, row) => sum + (row.requestMetrics?.count ?? 0), 0);

  if (isLoading) return <LoadingGrid />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={HardDrive}
          label={t('usageStorage.storage')}
          value={formatBytes(totalStorage)}
          helper={t('usageStorage.storageDesc')}
        />
        <SummaryCard
          icon={Activity}
          label={t('usageStorage.requests')}
          value={totalRequests.toLocaleString()}
          helper={t('usageStorage.requestsDesc')}
        />
        <SummaryCard
          icon={Database}
          label={t('usageStorage.tenants')}
          value={data.length.toLocaleString()}
          helper={t('usageStorage.realData')}
        />
      </div>
      <UsageRows rows={data} />
    </div>
  );
}

function Domains() {
  const t = useTranslations('SuperPortal.ops');
  const { data = [], isLoading, isError } = usePlatformDomains();

  if (isLoading) return <LoadingGrid />;
  if (isError) return <ErrorState />;

  return (
    <DataTable
      title={t('domains.tableTitle')}
      empty={t('empty')}
      headers={[t('tenant'), t('domain'), t('statusLabel')]}
      rows={data.map((row) => [
        row.tenant.name,
        row.domain ?? t('notConfigured'),
        row.status === 'configured' ? t('status.configured') : t('status.missing'),
      ])}
    />
  );
}

function FeatureFlags() {
  const { data = [], isLoading, isError } = usePlatformFeatureFlags();

  if (isLoading) return <LoadingGrid />;
  if (isError) return <ErrorState />;

  return (
    <div className="grid gap-4">
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        data.map((row) => <FeatureFlagCard key={row.tenant.id} row={row} />)
      )}
    </div>
  );
}

function FeatureFlagCard({ row }: { row: PlatformFeatureFlagRow }) {
  const t = useTranslations('SuperPortal.ops');
  const updateFlags = useUpdatePlatformFeatureFlags();
  const flags = Object.entries(row.featureFlags) as Array<[keyof typeof row.featureFlags, boolean]>;

  const toggleFlag = (key: keyof typeof row.featureFlags, value: boolean) => {
    updateFlags.mutate(
      { tenantId: row.tenant.id, featureFlags: { [key]: value } },
      {
        onSuccess: () => toast.success(t('featureFlags.updateSuccess')),
        onError: () => toast.error(t('featureFlags.updateError')),
      },
    );
  };

  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="mb-4">
        <h2 className="font-bold">{row.tenant.name}</h2>
        <p className="text-xs text-muted-foreground">{row.tenant.slug}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {flags.map(([key, value]) => (
          <button
            key={key}
            type="button"
            disabled={updateFlags.isPending}
            onClick={() => toggleFlag(key, !value)}
            className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
          >
            <span className="font-medium">{t(`featureFlags.keys.${key}`)}</span>
            {value ? (
              <ToggleRight className="h-5 w-5 text-emerald-600" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </article>
  );
}

function Incidents() {
  const t = useTranslations('SuperPortal.ops');
  const { data = [], isLoading, isError } = usePlatformIncidents();

  if (isLoading) return <LoadingGrid />;
  if (isError) return <ErrorState />;

  return (
    <DataTable
      title={t('incidents.tableTitle')}
      empty={t('incidents.empty')}
      headers={[t('incident'), t('severityLabel'), t('statusLabel'), t('tenant'), t('time')]}
      rows={data.map((incident) => [
        incident.title,
        incident.severity,
        incident.status,
        incident.tenantId ?? t('notConfigured'),
        formatDate(incident.createdAt),
      ])}
    />
  );
}

function AuditLogs() {
  const t = useTranslations('SuperPortal.ops');
  const { data = [], isLoading, isError } = usePlatformAuditLogs();

  if (isLoading) return <LoadingGrid />;
  if (isError) return <ErrorState />;

  return (
    <DataTable
      title={t('audit.tableTitle')}
      empty={t('empty')}
      headers={[t('tenant'), t('actor'), t('action'), t('statusLabel'), t('time')]}
      rows={data.map((log) => [
        log.tenantId,
        log.user?.email ?? log.userId ?? t('systemActor'),
        log.action,
        log.status,
        formatDate(log.createdAt),
      ])}
    />
  );
}

function AiSettings() {
  const t = useTranslations('SuperPortal.ops');
  const { data, isLoading, isError } = usePlatformAiStatus();

  if (isLoading) return <LoadingGrid />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={Bot}
          label={t('aiSettings.provider')}
          value={data.provider}
          helper={t('aiSettings.envManaged')}
        />
        <SummaryCard
          icon={CheckCircle2}
          label={t('aiSettings.configured')}
          value={data.configured ? t('status.configured') : t('status.missing')}
          helper={
            data.keyMasked === 'configured'
              ? t('aiSettings.keyConfigured')
              : t('aiSettings.keyMissing')
          }
        />
        <SummaryCard
          icon={Database}
          label={t('aiSettings.model')}
          value={data.model ?? t('notConfigured')}
          helper={t('aiSettings.noUiKeyStorage')}
        />
      </div>
      <DataTable
        title={t('aiSettings.tableTitle')}
        empty={t('empty')}
        headers={[t('statusLabel'), t('value')]}
        rows={[
          [t('aiSettings.mode'), data.mode],
          [t('aiSettings.dynamicConfig'), data.dynamicConfigEnabled ? t('on') : t('off')],
          [t('aiSettings.keyStorage'), data.keyStorage],
          [t('aiSettings.frontendExposure'), data.frontendExposureAllowed ? t('on') : t('off')],
        ]}
      />
    </div>
  );
}

function Infrastructure() {
  const t = useTranslations('SuperPortal.ops');
  const { data, isLoading, isError } = useSystemTelemetry();

  if (isLoading) return <LoadingGrid />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={ServerCog}
          label={t('infrastructure.uptime')}
          value={`${data.runtime.process.uptimeSeconds}s`}
          helper={`pid ${data.runtime.process.pid}`}
        />
        <SummaryCard
          icon={Activity}
          label={t('infrastructure.cpu')}
          value={data.runtime.cpu.loadAverage1m.toFixed(2)}
          helper={`${data.runtime.cpu.cores} cores`}
        />
        <SummaryCard
          icon={HardDrive}
          label={t('infrastructure.memory')}
          value={`${data.runtime.memory.rssMb} MB`}
          helper={`heap ${data.runtime.memory.heapUsedMb}/${data.runtime.memory.heapTotalMb} MB`}
        />
        <SummaryCard
          icon={AlertTriangle}
          label={t('infrastructure.alerts')}
          value={data.alerts.length.toLocaleString()}
          helper={t('infrastructure.realData')}
        />
      </div>
      <DataTable
        title={t('infrastructure.tenantTraffic')}
        empty={t('empty')}
        headers={[t('tenant'), t('usageStorage.requests'), t('errors'), t('latency')]}
        rows={data.requestMetrics.tenantTraffic.map((row) => [
          row.tenantId,
          row.count.toLocaleString(),
          row.errorCount.toLocaleString(),
          `${row.maxDurationMs} ms`,
        ])}
      />
    </div>
  );
}

function UsageRows({ rows }: { rows: PlatformUsageRow[] }) {
  const t = useTranslations('SuperPortal.ops');

  return (
    <DataTable
      title={t('usageStorage.tableTitle')}
      empty={t('empty')}
      headers={[t('tenant'), t('usageStorage.storage'), t('usageStorage.requests'), t('errors')]}
      rows={rows.map((row) => [
        row.tenant.name,
        formatBytes(row.mediaStorageBytes),
        (row.requestMetrics?.count ?? 0).toLocaleString(),
        (row.requestMetrics?.errorCount ?? 0).toLocaleString(),
      ])}
    />
  );
}

function SummaryCard({
  helper,
  icon: Icon,
  label,
  value,
}: {
  helper: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </article>
  );
}

function DataTable({
  empty,
  headers,
  rows,
  title,
}: {
  empty: string;
  headers: string[];
  rows: string[][];
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-4">
        <h2 className="font-bold">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">{empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, rowIndex) => (
                <tr key={`${row[0]}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`} className="whitespace-nowrap px-4 py-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LoadingGrid() {
  const t = useTranslations('SuperPortal.ops');
  return <LoadingState title={t('loading')} className="rounded-xl border bg-card" />;
}

function EmptyState() {
  const t = useTranslations('SuperPortal.ops');
  return (
    <SharedEmptyState icon={ListChecks} title={t('empty')} className="rounded-xl border bg-card" />
  );
}

function ErrorState() {
  const t = useTranslations('SuperPortal.ops');
  return <SharedErrorState title={t('loadError')} className="rounded-xl" />;
}

function formatBytes(value: number) {
  if (value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatBytesString(value: string) {
  return formatBytes(Number(value));
}

function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
