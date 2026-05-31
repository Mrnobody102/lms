'use client';

import {
  Activity,
  AlertTriangle,
  CircleDollarSign,
  CreditCard,
  Database,
  Flag,
  Globe2,
  HardDrive,
  ListChecks,
  LockKeyhole,
  ServerCog,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { PortalSidebar } from '@/components/layout/portal-sidebar';
import { LoginModal } from '@/features/auth/components/login-modal';
import { useAuthStore } from '@/features/auth/auth.store';
import { Tenant, useTenants } from '@/hooks/use-tenants';

export type OpsPageKind =
  | 'plansBilling'
  | 'usageStorage'
  | 'domains'
  | 'featureFlags'
  | 'incidents'
  | 'auditLogs'
  | 'infrastructure';

const PAGE_CONFIG: Record<OpsPageKind, { icon: LucideIcon; tone: string }> = {
  plansBilling: { icon: CreditCard, tone: 'bg-emerald-500/10 text-emerald-600' },
  usageStorage: { icon: HardDrive, tone: 'bg-blue-500/10 text-blue-600' },
  domains: { icon: Globe2, tone: 'bg-cyan-500/10 text-cyan-600' },
  featureFlags: { icon: Flag, tone: 'bg-violet-500/10 text-violet-600' },
  incidents: { icon: ListChecks, tone: 'bg-amber-500/10 text-amber-600' },
  auditLogs: { icon: Database, tone: 'bg-slate-500/10 text-slate-600' },
  infrastructure: { icon: ServerCog, tone: 'bg-indigo-500/10 text-indigo-600' },
};

export function PortalOpsPage({ kind }: { kind: OpsPageKind }) {
  const t = useTranslations('SuperPortal.ops');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { data: tenants = [], isLoading } = useTenants({
    enabled: isAuthenticated,
    includeInactive: true,
  });
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
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
            <span className="inline-flex w-fit items-center rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              {t('demoBadge')}
            </span>
          </div>

          {!isAuthenticated ? (
            <DemoLockedState />
          ) : (
            <OpsContent kind={kind} loading={isLoading} tenants={tenants} />
          )}
        </main>
      </div>
      {!isAuthenticated && <LoginModal />}
      <Footer />
    </div>
  );
}

function DemoLockedState() {
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

function OpsContent({
  kind,
  loading,
  tenants,
}: {
  kind: OpsPageKind;
  loading: boolean;
  tenants: Tenant[];
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-xl border bg-muted/30" />
        ))}
      </div>
    );
  }

  switch (kind) {
    case 'plansBilling':
      return <PlansBilling tenants={tenants} />;
    case 'usageStorage':
      return <UsageStorage tenants={tenants} />;
    case 'domains':
      return <Domains tenants={tenants} />;
    case 'featureFlags':
      return <FeatureFlags tenants={tenants} />;
    case 'incidents':
      return <Incidents tenants={tenants} />;
    case 'auditLogs':
      return <AuditLogs tenants={tenants} />;
    case 'infrastructure':
      return <Infrastructure tenants={tenants} />;
  }
}

function PlansBilling({ tenants }: { tenants: Tenant[] }) {
  const t = useTranslations('SuperPortal.ops');
  const active = tenants.filter((tenant) => tenant.isActive).length;
  const plans = [
    { name: 'Starter', price: '1.990.000 VND', tenants: Math.max(1, tenants.length - 2) },
    { name: 'Pro', price: '4.990.000 VND', tenants: Math.max(1, Math.ceil(active / 2)) },
    { name: 'Enterprise', price: t('contactSales'), tenants: Math.max(0, active - 1) },
  ];
  const invoices = tenants.slice(0, 5).map((tenant, index) => ({
    tenant: tenant.name,
    amount: `${(index + 2) * 1200000} VND`,
    status:
      index % 3 === 0
        ? t('status.pending')
        : index % 3 === 1
          ? t('status.refunded')
          : t('status.paid'),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <SummaryCard
            key={plan.name}
            icon={CircleDollarSign}
            label={plan.name}
            value={plan.price}
            helper={t('planTenantCount', { count: plan.tenants })}
          />
        ))}
      </div>
      <DemoTable
        title={t('plansBilling.invoiceTitle')}
        headers={[t('tenant'), t('amount'), t('statusLabel')]}
        rows={invoices.map((invoice) => [invoice.tenant, invoice.amount, invoice.status])}
      />
    </div>
  );
}

function UsageStorage({ tenants }: { tenants: Tenant[] }) {
  const t = useTranslations('SuperPortal.ops');
  const rows = tenants.slice(0, 6).map((tenant, index) => {
    const used = 28 + index * 11;
    const quota = 100;
    return {
      tenant: tenant.name,
      storage: `${used} / ${quota} GB`,
      api: `${(index + 1) * 18}k`,
      ai: `${42 + index * 7}%`,
      percent: used,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={HardDrive}
          label={t('usageStorage.storage')}
          value="412 GB"
          helper={t('usageStorage.storageDesc')}
        />
        <SummaryCard
          icon={AlertTriangle}
          label={t('usageStorage.ai')}
          value="68%"
          helper={t('usageStorage.aiDesc')}
        />
        <SummaryCard
          icon={Activity}
          label={t('usageStorage.requests')}
          value="182k"
          helper={t('usageStorage.requestsDesc')}
        />
      </div>
      <div className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <h2 className="font-bold">{t('usageStorage.tableTitle')}</h2>
        </div>
        <div className="divide-y">
          {rows.map((row) => (
            <div
              key={row.tenant}
              className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_180px_120px_120px]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{row.tenant}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
              <Cell label={t('usageStorage.storage')} value={row.storage} />
              <Cell label={t('usageStorage.requests')} value={row.api} />
              <Cell label={t('usageStorage.ai')} value={row.ai} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Domains({ tenants }: { tenants: Tenant[] }) {
  const t = useTranslations('SuperPortal.ops');
  const rows = tenants
    .slice(0, 8)
    .map((tenant, index) => [
      tenant.name,
      tenant.domain || `${tenant.slug}.lms.local`,
      index % 4 === 0 ? t('status.pending') : t('status.verified'),
      index % 3 === 0 ? t('status.renewing') : t('status.active'),
    ]);
  return (
    <DemoTable
      title={t('domains.tableTitle')}
      headers={[t('tenant'), t('domain'), t('dns'), t('ssl')]}
      rows={rows}
    />
  );
}

function FeatureFlags({ tenants }: { tenants: Tenant[] }) {
  const t = useTranslations('SuperPortal.ops');
  const flags = [
    'AI Tutor',
    'Roleplay',
    'Marketplace',
    'Billing',
    'Advanced reports',
    'Media upload',
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tenants.slice(0, 6).map((tenant, tenantIndex) => (
        <div key={tenant.id} className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="truncate font-bold">{tenant.name}</h2>
            <StatusBadge
              label={tenant.isActive ? t('status.active') : t('status.inactive')}
              tone={tenant.isActive ? 'success' : 'muted'}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {flags.map((flag, index) => {
              const enabled = (tenantIndex + index) % 3 !== 0;
              return (
                <div
                  key={flag}
                  className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                >
                  <span className="text-sm font-medium">{flag}</span>
                  <StatusBadge
                    label={enabled ? t('on') : t('off')}
                    tone={enabled ? 'success' : 'muted'}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Incidents({ tenants }: { tenants: Tenant[] }) {
  const t = useTranslations('SuperPortal.ops');
  const rows = [
    [
      t('incidents.mediaLatency'),
      tenants[0]?.name ?? 'Demo Language Center',
      t('severity.medium'),
      t('status.monitoring'),
    ],
    [
      t('incidents.emailDelay'),
      tenants[1]?.name ?? 'IELTS Academy',
      t('severity.low'),
      t('status.resolved'),
    ],
    [
      t('incidents.storageQuota'),
      tenants[2]?.name ?? 'Corporate Training',
      t('severity.high'),
      t('status.open'),
    ],
  ];
  return (
    <DemoTable
      title={t('incidents.tableTitle')}
      headers={[t('incident'), t('tenant'), t('severityLabel'), t('statusLabel')]}
      rows={rows}
    />
  );
}

function AuditLogs({ tenants }: { tenants: Tenant[] }) {
  const t = useTranslations('SuperPortal.ops');
  const actions = [
    t('audit.planChanged'),
    t('audit.quotaUpdated'),
    t('audit.domainVerified'),
    t('audit.flagToggled'),
    t('audit.invoiceExported'),
  ];
  const rows = actions.map((action, index) => [
    `super.admin@lms.local`,
    tenants[index % Math.max(tenants.length, 1)]?.name ?? 'Demo tenant',
    action,
    `${index + 1}h ago`,
  ]);
  return (
    <DemoTable
      title={t('audit.tableTitle')}
      headers={[t('actor'), t('tenant'), t('action'), t('time')]}
      rows={rows}
    />
  );
}

function Infrastructure({ tenants }: { tenants: Tenant[] }) {
  const t = useTranslations('SuperPortal.ops');
  const services = [
    ['API', 'Render Singapore', '42 ms', 'healthy'],
    ['PostgreSQL', 'Managed DB', '18 ms', 'healthy'],
    ['Redis', 'Queue/cache', '9 ms', 'healthy'],
    ['Object storage', 'Media bucket', '64 ms', tenants.length > 3 ? 'warning' : 'healthy'],
    ['Realtime notifications', 'SSE channel', '38 ms', 'healthy'],
    ['Email', 'SMTP provider', '72 ms', 'healthy'],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {services.map(([name, region, latency, status]) => (
        <div key={name} className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">{name}</h2>
              <p className="text-sm text-muted-foreground">{region}</p>
            </div>
            <StatusBadge
              label={status === 'warning' ? t('status.warning') : t('status.healthy')}
              tone={status === 'warning' ? 'warning' : 'success'}
            />
          </div>
          <Cell label={t('latency')} value={latency} />
        </div>
      ))}
    </div>
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
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

function DemoTable({
  headers,
  rows,
  title,
}: {
  headers: string[];
  rows: string[][];
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-4">
        <h2 className="font-bold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-bold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, rowIndex) => (
              <tr key={`${row[0]}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className="px-4 py-3">
                    {cellIndex === row.length - 1 ? (
                      <StatusCell value={cell} />
                    ) : (
                      <span className={cellIndex === 0 ? 'font-semibold' : 'text-muted-foreground'}>
                        {cell}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusCell({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone =
    normalized.includes('paid') ||
    normalized.includes('verified') ||
    normalized.includes('active') ||
    normalized.includes('resolved') ||
    normalized.includes('healthy')
      ? 'success'
      : normalized.includes('pending') || normalized.includes('monitoring')
        ? 'warning'
        : 'muted';

  return <StatusBadge label={value} tone={tone} />;
}

function StatusBadge({ label, tone }: { label: string; tone: 'success' | 'warning' | 'muted' }) {
  const className =
    tone === 'success'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
      : tone === 'warning'
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-700'
        : 'border-border bg-muted text-muted-foreground';

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
