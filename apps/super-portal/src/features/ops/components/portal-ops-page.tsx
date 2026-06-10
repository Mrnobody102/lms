'use client';

import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  Database,
  Flag,
  Globe2,
  HardDrive,
  ListChecks,
  LockKeyhole,
  Search,
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
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { PortalSidebar } from '@/components/layout/portal-sidebar';
import { LoginModal } from '@/features/auth/components/login-modal';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  PlatformFeatureFlagRow,
  PlatformAiUsageRow,
  PlatformListParams,
  PlatformPaginationMeta,
  PlatformUsageRow,
  usePlatformAuditLogs,
  usePlatformAiStatus,
  usePlatformAiUsage,
  usePlatformBilling,
  usePlatformDomains,
  usePlatformFeatureFlags,
  usePlatformIncidents,
  usePlatformUsage,
  useUpdatePlatformFeatureFlags,
} from '@/hooks/use-platform';
import { useSystemTelemetry } from '@/hooks/use-system-telemetry';
import { useTenants } from '@/hooks/use-tenants';

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

const DEFAULT_OPS_PAGE_SIZE = 10;

interface StatusOption {
  value: string;
  label: string;
}

interface OpsTableState {
  limit: number;
  page: number;
  params: PlatformListParams;
  search: string;
  status: string;
  tenantId: string;
  setLimit: (value: number) => void;
  setPage: (value: number) => void;
  setSearch: (value: string) => void;
  setStatus: (value: string) => void;
  setTenantId: (value: string) => void;
}

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
  const table = useOpsTableState();
  const { data, isFetching, isLoading, isError } = usePlatformBilling(table.params);

  if (isLoading) return <LoadingGrid />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <OpsFilterBar state={table} statusOptions={billingStatusOptions(t)} isFetching={isFetching} />
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={CreditCard}
          label={t('plansBilling.plans')}
          value={data.summary.plans.toLocaleString()}
          helper={t('plansBilling.realData')}
        />
        <SummaryCard
          icon={CheckCircle2}
          label={t('plansBilling.subscriptions')}
          value={data.summary.subscriptions.toLocaleString()}
          helper={t('plansBilling.realData')}
        />
        <SummaryCard
          icon={Database}
          label={t('plansBilling.invoices')}
          value={data.summary.invoices.toLocaleString()}
          helper={t('plansBilling.realData')}
        />
      </div>
      <PaginatedDataTable
        title={t('plansBilling.subscriptionTitle')}
        empty={t('empty')}
        headers={[t('tenant'), t('plan'), t('statusLabel'), t('quota')]}
        rows={data.subscriptions.items.map((subscription) => [
          subscription.tenant.name,
          subscription.plan.name,
          subscription.status,
          formatBytesString(subscription.storageQuotaBytes),
        ])}
        meta={data.subscriptions.meta}
        onPageChange={table.setPage}
      />
      <PaginatedDataTable
        title={t('plansBilling.invoiceTitle')}
        empty={t('empty')}
        headers={[t('tenant'), t('invoice'), t('amount'), t('statusLabel')]}
        rows={data.invoices.items.map((invoice) => [
          invoice.tenant.name,
          invoice.number,
          formatMoney(invoice.totalMinor, invoice.currency),
          invoice.status,
        ])}
        meta={data.invoices.meta}
        onPageChange={table.setPage}
      />
    </div>
  );
}

function UsageStorage() {
  const t = useTranslations('SuperPortal.ops');
  const table = useOpsTableState();
  const { data, isFetching, isLoading, isError } = usePlatformUsage(table.params);
  const rows = data?.items ?? [];
  const totalStorage = rows.reduce((sum, row) => sum + row.mediaStorageBytes, 0);
  const totalRequests = rows.reduce((sum, row) => sum + (row.requestMetrics?.count ?? 0), 0);

  if (isLoading) return <LoadingGrid />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <OpsFilterBar state={table} statusOptions={tenantStatusOptions(t)} isFetching={isFetching} />
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
          value={data.meta.total.toLocaleString()}
          helper={t('usageStorage.realData')}
        />
      </div>
      <UsageRows rows={rows} meta={data.meta} onPageChange={table.setPage} />
    </div>
  );
}

function Domains() {
  const t = useTranslations('SuperPortal.ops');
  const table = useOpsTableState();
  const { data, isFetching, isLoading, isError } = usePlatformDomains(table.params);

  if (isLoading) return <LoadingGrid />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <OpsFilterBar state={table} statusOptions={domainStatusOptions(t)} isFetching={isFetching} />
      <PaginatedDataTable
        title={t('domains.tableTitle')}
        empty={t('empty')}
        headers={[t('tenant'), t('domain'), t('statusLabel')]}
        rows={data.items.map((row) => [
          row.tenant.name,
          row.domain ?? t('notConfigured'),
          row.status === 'configured' ? t('status.configured') : t('status.missing'),
        ])}
        meta={data.meta}
        onPageChange={table.setPage}
      />
    </div>
  );
}

function FeatureFlags() {
  const t = useTranslations('SuperPortal.ops');
  const table = useOpsTableState();
  const { data, isFetching, isLoading, isError } = usePlatformFeatureFlags(table.params);

  if (isLoading) return <LoadingGrid />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <OpsFilterBar state={table} statusOptions={tenantStatusOptions(t)} isFetching={isFetching} />
      <div className="grid gap-4">
        {data.items.length === 0 ? (
          <EmptyState />
        ) : (
          data.items.map((row) => <FeatureFlagCard key={row.tenant.id} row={row} />)
        )}
      </div>
      <PaginationFooter meta={data.meta} onPageChange={table.setPage} />
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
  const table = useOpsTableState();
  const { data, isFetching, isLoading, isError } = usePlatformIncidents(table.params);

  if (isLoading) return <LoadingGrid />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <OpsFilterBar
        state={table}
        statusOptions={incidentStatusOptions(t)}
        isFetching={isFetching}
      />
      <PaginatedDataTable
        title={t('incidents.tableTitle')}
        empty={t('incidents.empty')}
        headers={[t('incident'), t('severityLabel'), t('statusLabel'), t('tenant'), t('time')]}
        rows={data.items.map((incident) => [
          incident.title,
          incident.severity,
          incident.status,
          incident.tenantId ?? t('notConfigured'),
          formatDate(incident.createdAt),
        ])}
        meta={data.meta}
        onPageChange={table.setPage}
      />
    </div>
  );
}

function AuditLogs() {
  const t = useTranslations('SuperPortal.ops');
  const table = useOpsTableState();
  const { data, isFetching, isLoading, isError } = usePlatformAuditLogs(table.params);

  if (isLoading) return <LoadingGrid />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <OpsFilterBar state={table} statusOptions={auditStatusOptions(t)} isFetching={isFetching} />
      <PaginatedDataTable
        title={t('audit.tableTitle')}
        empty={t('empty')}
        headers={[t('tenant'), t('actor'), t('action'), t('statusLabel'), t('time')]}
        rows={data.items.map((log) => [
          log.tenantId,
          log.user?.email ?? log.userId ?? t('systemActor'),
          log.action,
          log.status,
          formatDate(log.createdAt),
        ])}
        meta={data.meta}
        onPageChange={table.setPage}
      />
    </div>
  );
}

function AiSettings() {
  const t = useTranslations('SuperPortal.ops');
  const table = useOpsTableState();
  const { data, isLoading, isError } = usePlatformAiStatus();
  const {
    data: usageData,
    isFetching,
    isLoading: isUsageLoading,
    isError: isUsageError,
  } = usePlatformAiUsage(table.params);

  if (isLoading || isUsageLoading) return <LoadingGrid />;
  if (isError || isUsageError || !data || !usageData) return <ErrorState />;

  return (
    <div className="space-y-6">
      <OpsFilterBar state={table} statusOptions={tenantStatusOptions(t)} isFetching={isFetching} />
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
      <AiUsageCards rows={usageData.items} />
      <PaginatedDataTable
        title={t('aiSettings.usageTableTitle')}
        empty={t('empty')}
        headers={[
          t('tenant'),
          t('aiSettings.provider'),
          t('aiSettings.quota'),
          t('aiSettings.used'),
          t('aiSettings.remaining'),
          t('time'),
        ]}
        rows={usageData.items.map((row) => [
          row.tenant.name,
          row.configured ? row.provider : t('status.missing'),
          row.quotaConfigured
            ? (row.subscriptionQuota ?? 0).toLocaleString()
            : t('aiSettings.quotaFallback'),
          row.periodUsed.toLocaleString(),
          row.periodRemaining === null ? t('notConfigured') : row.periodRemaining.toLocaleString(),
          row.latestRequestAt ? formatDate(row.latestRequestAt) : t('notConfigured'),
        ])}
        meta={usageData.meta}
        onPageChange={table.setPage}
      />
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

function AiUsageCards({ rows }: { rows: PlatformAiUsageRow[] }) {
  const t = useTranslations('SuperPortal.ops');
  const configuredTenants = rows.filter((row) => row.quotaConfigured).length;
  const usedRequests = rows.reduce((sum, row) => sum + row.periodUsed, 0);
  const latest = rows
    .map((row) => row.latestRequestAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SummaryCard
        icon={CheckCircle2}
        label={t('aiSettings.quotaConfigured')}
        value={`${configuredTenants}/${rows.length}`}
        helper={t('aiSettings.quotaConfiguredHelper')}
      />
      <SummaryCard
        icon={Activity}
        label={t('aiSettings.used')}
        value={usedRequests.toLocaleString()}
        helper={t('aiSettings.usedHelper')}
      />
      <SummaryCard
        icon={Database}
        label={t('aiSettings.latestRequest')}
        value={latest ? formatDate(latest) : t('notConfigured')}
        helper={t('aiSettings.latestRequestHelper')}
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

function useOpsTableState(): OpsTableState {
  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState(DEFAULT_OPS_PAGE_SIZE);
  const [search, setSearchState] = useState('');
  const [tenantId, setTenantIdState] = useState('all');
  const [status, setStatusState] = useState('all');
  const params = useMemo<PlatformListParams>(
    () => ({
      page,
      limit,
      search: search.trim() || undefined,
      tenantId: tenantId === 'all' ? undefined : tenantId,
      status: status === 'all' ? undefined : status,
    }),
    [limit, page, search, status, tenantId],
  );

  return {
    limit,
    page,
    params,
    search,
    status,
    tenantId,
    setLimit: (value) => {
      setLimitState(value);
      setPageState(1);
    },
    setPage: setPageState,
    setSearch: (value) => {
      setSearchState(value);
      setPageState(1);
    },
    setStatus: (value) => {
      setStatusState(value);
      setPageState(1);
    },
    setTenantId: (value) => {
      setTenantIdState(value);
      setPageState(1);
    },
  };
}

function OpsFilterBar({
  isFetching,
  state,
  statusOptions,
}: {
  isFetching: boolean;
  state: OpsTableState;
  statusOptions: StatusOption[];
}) {
  const t = useTranslations('SuperPortal.ops');
  const tenantsQuery = useTenants({ includeInactive: true });

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_180px_120px_auto] lg:items-end">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('table.searchLabel')}
          </span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={state.search}
              onChange={(event) => state.setSearch(event.target.value)}
              placeholder={t('table.search')}
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-primary/20 placeholder:text-muted-foreground focus:ring-2"
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('table.tenantFilter')}
          </span>
          <select
            value={state.tenantId}
            onChange={(event) => state.setTenantId(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-primary/20 focus:ring-2"
          >
            <option value="all">{t('table.allTenants')}</option>
            {(tenantsQuery.data ?? []).map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('table.statusFilter')}
          </span>
          <select
            value={state.status}
            onChange={(event) => state.setStatus(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-primary/20 focus:ring-2"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('table.rowsPerPage')}
          </span>
          <select
            value={state.limit}
            onChange={(event) => state.setLimit(Number(event.target.value))}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-primary/20 focus:ring-2"
          >
            {[10, 25, 50, 100].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs font-medium text-muted-foreground">
          {isFetching ? t('table.refreshing') : t('table.serverBacked')}
        </div>
      </div>
    </section>
  );
}

function PaginatedDataTable({
  empty,
  headers,
  meta,
  onPageChange,
  rows,
  title,
}: {
  empty: string;
  headers: string[];
  meta: PlatformPaginationMeta;
  onPageChange: (page: number) => void;
  rows: string[][];
  title: string;
}) {
  const t = useTranslations('SuperPortal.ops');

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-4">
        <h2 className="font-bold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('table.totalRows', { count: meta.total })}
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">{empty}</div>
      ) : (
        <>
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
                  <tr key={`${row[0]}-${meta.page}-${rowIndex}`}>
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
          <PaginationFooter meta={meta} onPageChange={onPageChange} embedded />
        </>
      )}
    </section>
  );
}

function PaginationFooter({
  embedded = false,
  meta,
  onPageChange,
}: {
  embedded?: boolean;
  meta: PlatformPaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations('SuperPortal.ops');
  const showingStart = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const showingEnd = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div
      className={`flex flex-col gap-3 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between ${
        embedded ? 'border-t' : 'rounded-xl border bg-card'
      }`}
    >
      <span>
        {t('table.showingRows', {
          start: showingStart,
          end: showingEnd,
          total: meta.total,
        })}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(Math.max(1, meta.page - 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t('table.previous')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center text-xs font-medium">
          {t('table.pageValue', { page: meta.page, total: meta.totalPages })}
        </span>
        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(Math.min(meta.totalPages, meta.page + 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t('table.next')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function tenantStatusOptions(t: ReturnType<typeof useTranslations>): StatusOption[] {
  return [
    { value: 'all', label: t('table.allStatuses') },
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
  ];
}

function domainStatusOptions(t: ReturnType<typeof useTranslations>): StatusOption[] {
  return [
    { value: 'all', label: t('table.allStatuses') },
    { value: 'configured', label: t('status.configured') },
    { value: 'missing', label: t('status.missing') },
  ];
}

function auditStatusOptions(t: ReturnType<typeof useTranslations>): StatusOption[] {
  return [
    { value: 'all', label: t('table.allStatuses') },
    { value: 'success', label: t('status.success') },
    { value: 'failure', label: t('status.failure') },
  ];
}

function incidentStatusOptions(t: ReturnType<typeof useTranslations>): StatusOption[] {
  return [
    { value: 'all', label: t('table.allStatuses') },
    { value: 'open', label: t('status.open') },
    { value: 'monitoring', label: t('status.monitoring') },
    { value: 'resolved', label: t('status.resolved') },
  ];
}

function billingStatusOptions(t: ReturnType<typeof useTranslations>): StatusOption[] {
  return [
    { value: 'all', label: t('table.allStatuses') },
    { value: 'active', label: t('status.active') },
    { value: 'paid', label: t('status.paid') },
    { value: 'pending', label: t('status.pending') },
    { value: 'past_due', label: t('status.pastDue') },
    { value: 'canceled', label: t('status.canceled') },
  ];
}

function UsageRows({
  meta,
  onPageChange,
  rows,
}: {
  meta: PlatformPaginationMeta;
  onPageChange: (page: number) => void;
  rows: PlatformUsageRow[];
}) {
  const t = useTranslations('SuperPortal.ops');

  return (
    <PaginatedDataTable
      title={t('usageStorage.tableTitle')}
      empty={t('empty')}
      headers={[t('tenant'), t('usageStorage.storage'), t('usageStorage.requests'), t('errors')]}
      rows={rows.map((row) => [
        row.tenant.name,
        formatBytes(row.mediaStorageBytes),
        (row.requestMetrics?.count ?? 0).toLocaleString(),
        (row.requestMetrics?.errorCount ?? 0).toLocaleString(),
      ])}
      meta={meta}
      onPageChange={onPageChange}
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
  const t = useTranslations('SuperPortal.ops');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!normalizedQuery) return rows;
    return rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(normalizedQuery)));
  }, [normalizedQuery, rows]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const visibleRows = filteredRows.slice(startIndex, startIndex + pageSize);
  const showingStart = filteredRows.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + pageSize, filteredRows.length);
  const hasControls = rows.length > 10;

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updatePageSize = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-bold">{title}</h2>
          {rows.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('table.totalRows', { count: rows.length })}
            </p>
          ) : null}
        </div>
        {hasControls ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder={t('table.search')}
                aria-label={t('table.search')}
                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-primary/20 placeholder:text-muted-foreground focus:ring-2"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {t('table.rowsPerPage')}
              <select
                value={pageSize}
                onChange={(event) => updatePageSize(event.target.value)}
                aria-label={t('table.rowsPerPage')}
                className="h-10 rounded-md border bg-background px-2 text-sm text-foreground outline-none ring-primary/20 focus:ring-2"
              >
                {[10, 25, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">{empty}</div>
      ) : filteredRows.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">{t('table.noResults')}</div>
      ) : (
        <>
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
                {visibleRows.map((row, rowIndex) => (
                  <tr key={`${row[0]}-${startIndex + rowIndex}`}>
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
          {hasControls ? (
            <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {t('table.showingRows', {
                  start: showingStart,
                  end: showingEnd,
                  total: filteredRows.length,
                })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t('table.previous')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-16 text-center text-xs font-medium">
                  {safePage} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t('table.next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </>
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
