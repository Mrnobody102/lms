'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Save,
  ShieldCheck,
  TicketCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge, Button, Input, Label } from '@/components/ui';
import { useActivationCodes } from '@/hooks/use-activation-codes';
import { useAdminOverview } from '@/hooks/use-admin-users';
import { useBillingConfig, useUpdateBillingConfig } from '@/hooks/use-billing';
import type { ActivationCodeSummary } from '@/lib/activation-api';
import type { BillingConfig } from '@/lib/billing-api';

const DEFAULT_BILLING_CONFIG: BillingConfig = {
  paymentProvider: 'none',
  paymentPublicKey: '',
  paymentMerchantId: '',
  paymentWebhookUrl: '',
  currency: 'VND',
  baseCoursePriceMinor: 0,
  discountPercent: 0,
  taxPercent: 0,
  invoicePrefix: 'INV',
  exportFormat: 'csv',
  updatedAt: null,
};

export default function FinancePage() {
  const t = useTranslations('Admin.financePage');
  const locale = useLocale();
  const overviewQuery = useAdminOverview();
  const activationQuery = useActivationCodes();
  const billingQuery = useBillingConfig();
  const updateBilling = useUpdateBillingConfig();
  const [billingForm, setBillingForm] = useState<BillingConfig>(DEFAULT_BILLING_CONFIG);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  const activationCodes = useMemo(() => activationQuery.data ?? [], [activationQuery.data]);

  useEffect(() => {
    if (billingQuery.data) {
      setBillingForm(billingQuery.data);
    }
  }, [billingQuery.data]);

  const billingDirty = useMemo(() => {
    const source = billingQuery.data ?? DEFAULT_BILLING_CONFIG;
    return (
      JSON.stringify({ ...billingForm, updatedAt: null }) !==
      JSON.stringify({ ...source, updatedAt: null })
    );
  }, [billingForm, billingQuery.data]);

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

  const isLoading = overviewQuery.isLoading || activationQuery.isLoading || billingQuery.isLoading;
  const hasError = overviewQuery.isError || activationQuery.isError || billingQuery.isError;

  const handleSaveBilling = () => {
    updateBilling.mutate(
      {
        paymentProvider: billingForm.paymentProvider,
        paymentPublicKey: billingForm.paymentPublicKey,
        paymentMerchantId: billingForm.paymentMerchantId,
        paymentWebhookUrl: billingForm.paymentWebhookUrl,
        currency: billingForm.currency,
        baseCoursePriceMinor: billingForm.baseCoursePriceMinor,
        discountPercent: billingForm.discountPercent,
        taxPercent: billingForm.taxPercent,
        invoicePrefix: billingForm.invoicePrefix,
        exportFormat: billingForm.exportFormat,
      },
      {
        onSuccess: (config) => {
          setBillingForm(config);
          setBillingMessage(t('billingSaveSuccess'));
        },
        onError: () => setBillingMessage(t('billingSaveError')),
      },
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-[var(--admin-sidebar-width)] p-6 lg:p-8">
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
                  <FinanceReadiness config={billingForm} />
                </section>

                <section className="mt-8">
                  {billingMessage && (
                    <div className="mb-4 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                      {billingMessage}
                    </div>
                  )}
                  <BillingConfigPanel
                    config={billingForm}
                    dirty={billingDirty}
                    saving={updateBilling.isPending}
                    onChange={setBillingForm}
                    onSave={handleSaveBilling}
                  />
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

function FinanceReadiness({ config }: { config: BillingConfig }) {
  const t = useTranslations('Admin.financePage');
  const providerConfigured =
    config.paymentProvider === 'manual' ||
    (config.paymentProvider !== 'none' &&
      Boolean(config.paymentPublicKey.trim() || config.paymentMerchantId.trim()));
  const pricingConfigured = config.baseCoursePriceMinor > 0;
  const items = [
    {
      icon: CreditCard,
      title: t('billingProviderTitle'),
      desc: t('billingProviderDesc'),
      status: providerConfigured ? t('configured') : t('notConfigured'),
      ready: providerConfigured,
    },
    {
      icon: BarChart3,
      title: t('pricingRulesTitle'),
      desc: t('pricingRulesDesc'),
      status: pricingConfigured ? t('configured') : t('notConfigured'),
      ready: pricingConfigured,
    },
    {
      icon: FileDown,
      title: t('exportTitle'),
      desc: t('exportDesc'),
      status: config.exportFormat.toUpperCase(),
      ready: true,
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
              <Badge variant={item.ready ? 'success' : 'outline'} className="shrink-0 text-[11px]">
                {item.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingConfigPanel({
  config,
  dirty,
  saving,
  onChange,
  onSave,
}: {
  config: BillingConfig;
  dirty: boolean;
  saving: boolean;
  onChange: (config: BillingConfig) => void;
  onSave: () => void;
}) {
  const t = useTranslations('Admin.financePage');
  const update = <Key extends keyof BillingConfig>(key: Key, value: BillingConfig[Key]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{t('billingConfigTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('billingConfigDesc')}</p>
        </div>
        {dirty && <Badge variant="warning">{t('unsavedBilling')}</Badge>}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">{t('paymentSection')}</h3>
          <div className="space-y-1.5">
            <Label>{t('paymentProvider')}</Label>
            <select
              value={config.paymentProvider}
              onChange={(event) =>
                update('paymentProvider', event.target.value as BillingConfig['paymentProvider'])
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {(['none', 'manual', 'stripe', 'payos', 'vnpay', 'momo'] as const).map((provider) => (
                <option key={provider} value={provider}>
                  {t(`paymentProviders.${provider}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('paymentPublicKey')}</Label>
            <Input
              value={config.paymentPublicKey}
              onChange={(event) => update('paymentPublicKey', event.target.value)}
              placeholder="pk_..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('paymentMerchantId')}</Label>
            <Input
              value={config.paymentMerchantId}
              onChange={(event) => update('paymentMerchantId', event.target.value)}
              placeholder="merchant-id"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('paymentWebhookUrl')}</Label>
            <Input
              type="url"
              value={config.paymentWebhookUrl}
              onChange={(event) => update('paymentWebhookUrl', event.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">{t('pricingSection')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('currency')}</Label>
              <Input
                value={config.currency}
                onChange={(event) => update('currency', event.target.value.toUpperCase())}
                maxLength={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('baseCoursePrice')}</Label>
              <Input
                type="number"
                min={0}
                value={config.baseCoursePriceMinor}
                onChange={(event) =>
                  update('baseCoursePriceMinor', Number(event.target.value || 0))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('discountPercent')}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.discountPercent}
                onChange={(event) => update('discountPercent', Number(event.target.value || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('taxPercent')}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.taxPercent}
                onChange={(event) => update('taxPercent', Number(event.target.value || 0))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">{t('exportSection')}</h3>
          <div className="space-y-1.5">
            <Label>{t('invoicePrefix')}</Label>
            <Input
              value={config.invoicePrefix}
              onChange={(event) => update('invoicePrefix', event.target.value.toUpperCase())}
              maxLength={12}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('exportFormat')}</Label>
            <select
              value={config.exportFormat}
              onChange={(event) =>
                update('exportFormat', event.target.value as BillingConfig['exportFormat'])
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
            </select>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
            {t('secretKeyNotice')}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end border-t pt-4">
        <Button onClick={onSave} disabled={!dirty || saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t('saveBilling')}
        </Button>
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
