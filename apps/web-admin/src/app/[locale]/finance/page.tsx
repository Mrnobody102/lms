'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileDown,
  KeyRound,
  Loader2,
  ShieldCheck,
  TicketCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge } from '@/components/ui';
import { useActivationCodes } from '@/hooks/use-activation-codes';
import { useAdminOverview } from '@/hooks/use-admin-users';
import type { ActivationCodeSummary } from '@/lib/activation-api';

export default function FinancePage() {
  const t = useTranslations('Admin.financePage');
  const locale = useLocale();
  const overviewQuery = useAdminOverview();
  const activationQuery = useActivationCodes();

  const activationCodes = useMemo(() => activationQuery.data ?? [], [activationQuery.data]);

  const metrics = useMemo(() => {
    const issued = activationCodes.reduce((total, code) => total + code.maxUses, 0);
    const redeemed = activationCodes.reduce((total, code) => total + code.usedCount, 0);
    const activeCodes = activationCodes.filter((code) => getCodeStatus(code) === 'active').length;
    const availableSeats = Math.max(issued - redeemed, 0);
    const redemptionRate = issued > 0 ? Math.round((redeemed / issued) * 100) : 0;

    return {
      issued,
      redeemed,
      activeCodes,
      availableSeats,
      redemptionRate,
    };
  }, [activationCodes]);

  const stats: FinanceStat[] = [
    {
      label: t('activeEnrollments'),
      value: overviewQuery.data?.totals.activeEnrollments ?? 0,
      detail: t('trackedSessions', {
        count: overviewQuery.data?.totals.trackedSessions ?? 0,
      }),
      icon: TrendingUp,
    },
    {
      label: t('activationCapacity'),
      value: metrics.issued,
      detail: t('activeCodes', { count: metrics.activeCodes }),
      icon: KeyRound,
    },
    {
      label: t('redeemedActivations'),
      value: metrics.redeemed,
      detail: t('redemptionRate', { value: metrics.redemptionRate }),
      icon: TicketCheck,
    },
    {
      label: t('availableSeats'),
      value: metrics.availableSeats,
      detail: t('unredeemedCapacity'),
      icon: WalletCards,
    },
  ];

  const isLoading = overviewQuery.isLoading || activationQuery.isLoading;
  const hasError = overviewQuery.isError || activationQuery.isError;

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader title={t('title')} description={t('desc')} />

            {hasError ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('loadError')}</AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('loading')}
              </div>
            ) : (
              <>
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map((stat) => (
                    <FinanceStatCard key={stat.label} stat={stat} />
                  ))}
                </section>

                <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                  <ActivationCodeTable codes={activationCodes} locale={locale} />
                  <FinanceReadiness />
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

interface FinanceStat {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
}

function FinanceStatCard({ stat }: { stat: FinanceStat }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <stat.icon className="h-5 w-5" />
        </div>
        <Badge variant="secondary" className="text-xs">
          {stat.detail}
        </Badge>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
    </div>
  );
}

function FinanceReadiness() {
  const t = useTranslations('Admin.financePage');
  const items = [
    {
      icon: CreditCard,
      title: t('billingProviderTitle'),
      desc: t('billingProviderDesc'),
      status: t('notConfigured'),
    },
    {
      icon: BarChart3,
      title: t('pricingRulesTitle'),
      desc: t('pricingRulesDesc'),
      status: t('notConfigured'),
    },
    {
      icon: FileDown,
      title: t('exportTitle'),
      desc: t('exportDesc'),
      status: t('availableSoon'),
    },
  ];

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold">{t('readinessTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('readinessDesc')}</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[11px]">
                {item.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivationCodeTable({
  codes,
  locale,
}: {
  codes: ActivationCodeSummary[];
  locale: string;
}) {
  const t = useTranslations('Admin.financePage');

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-5 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">{t('activationTableTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('activationTableDesc')}</p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {t('codeCount', { count: codes.length })}
          </Badge>
        </div>
      </div>

      {codes.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <KeyRound className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{t('emptyTitle')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t('emptyDesc')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b bg-muted/20 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">{t('codeColumn')}</th>
                <th className="px-5 py-3 font-semibold">{t('courseColumn')}</th>
                <th className="px-5 py-3 font-semibold">{t('usageColumn')}</th>
                <th className="px-5 py-3 font-semibold">{t('expiryColumn')}</th>
                <th className="px-5 py-3 font-semibold">{t('statusColumn')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {codes.map((code) => {
                const status = getCodeStatus(code);
                const remaining = Math.max(code.maxUses - code.usedCount, 0);

                return (
                  <tr key={code.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-mono text-sm font-semibold">{code.code}</p>
                      <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
                        {code.description || t('noDescription')}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {code.course?.title ? (
                        <p className="max-w-[220px] truncate font-medium">{code.course.title}</p>
                      ) : (
                        <span className="text-muted-foreground">{t('allCourses')}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {t('usageValue', {
                          used: code.usedCount,
                          total: code.maxUses,
                        })}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('remainingValue', { count: remaining })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        {code.expiresAt ? formatDate(code.expiresAt, locale) : t('noExpiry')}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ActivationStatus }) {
  const t = useTranslations('Admin.financePage.status');

  if (status === 'active') {
    return (
      <Badge variant="secondary" className="gap-1 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        {t('active')}
      </Badge>
    );
  }

  return <Badge variant="outline">{t(status)}</Badge>;
}

type ActivationStatus = 'active' | 'inactive' | 'expired' | 'usedUp';

function getCodeStatus(code: ActivationCodeSummary): ActivationStatus {
  if (!code.isActive) return 'inactive';
  if (code.expiresAt && new Date(code.expiresAt).getTime() < Date.now()) return 'expired';
  if (code.usedCount >= code.maxUses) return 'usedUp';
  return 'active';
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(value));
}
