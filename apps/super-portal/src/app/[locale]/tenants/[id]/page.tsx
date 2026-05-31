'use client';

import { use, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  KeyRound,
  Mail,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { PortalSidebar } from '@/components/layout/portal-sidebar';
import { LoginModal } from '@/features/auth/components/login-modal';
import { useAuthStore } from '@/features/auth/auth.store';
import { Tenant, useTenant, useUpdateTenant } from '@/hooks/use-tenants';
import { Link } from '@/navigation';

const DEFAULT_PRIMARY_COLOR = '#2563eb';
const DEFAULT_TENANT_LOCALE: 'vi' = 'vi';
type TenantDetailTab = 'overview' | 'branding' | 'access' | 'limits';
type TenantSettingsTab = Exclude<TenantDetailTab, 'overview'>;

export default function TenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('SuperPortal.tenantDetails');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<TenantDetailTab>('overview');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { data: currentTenant, isLoading: tenantLoading } = useTenant(id, {
    enabled: isAuthenticated,
  });

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Activity className="w-10 h-10 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground font-medium">{t('loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col text-foreground">
        <Header />
        <div className="flex-1" />
        <Footer />
        <LoginModal />
      </div>
    );
  }

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex flex-col text-foreground">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Activity className="w-10 h-10 text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground font-medium">{t('loading')}</p>
        </div>
        <Footer />
        {!isAuthenticated && <LoginModal />}
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="min-h-screen flex flex-col text-foreground">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-muted-foreground font-medium">{t('notFound')}</p>
          <Link href="/" className="mt-4 text-primary underline">
            {t('backToList')}
          </Link>
        </div>
        <Footer />
        {!isAuthenticated && <LoginModal />}
      </div>
    );
  }

  const tenantSettings = normalizeTenantSettings(currentTenant.settings);

  return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="flex">
        <PortalSidebar />
        <div className="mx-auto max-w-7xl p-8 text-foreground">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToList')}
            </Link>
          </div>

          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h1 className="flex min-w-0 items-center gap-3 text-3xl font-extrabold">
                  <Building2 className="h-8 w-8 shrink-0 text-primary" />
                  <span className="truncate">{currentTenant.name}</span>
                </h1>
                <TenantStatusBadge isActive={currentTenant.isActive} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Globe className="h-4 w-4" />
                  {currentTenant.domain || `${currentTenant.slug}.lms.com`}
                </span>
                {currentTenant.domain && (
                  <a
                    href={`https://${currentTenant.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {t('openDomain')}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <TenantTabs activeTab={activeTab} onChange={setActiveTab} />

          <div className="mt-6">
            {activeTab === 'overview' ? (
              <TenantOverview locale={locale} settings={tenantSettings} tenant={currentTenant} />
            ) : (
              <TenantSettingsForm mode={activeTab} tenant={currentTenant} />
            )}
          </div>
        </div>
      </div>
      {!isAuthenticated && <LoginModal />}
      <Footer />
    </div>
  );
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function TenantStatusBadge({ isActive }: { isActive: boolean }) {
  const t = useTranslations('SuperPortal.tenantDetails');

  return isActive ? (
    <span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {t('active')}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
      {t('inactive')}
    </span>
  );
}

function TenantTabs({
  activeTab,
  onChange,
}: {
  activeTab: TenantDetailTab;
  onChange: (tab: TenantDetailTab) => void;
}) {
  const t = useTranslations('SuperPortal.tenantDetails');
  const tabs: Array<{ icon: LucideIcon; id: TenantDetailTab; label: string }> = [
    { id: 'overview', label: t('tabOverview'), icon: Building2 },
    { id: 'branding', label: t('tabBranding'), icon: Palette },
    { id: 'access', label: t('tabAccess'), icon: KeyRound },
    { id: 'limits', label: t('tabLimits'), icon: SlidersHorizontal },
  ];

  return (
    <div className="flex flex-wrap gap-2 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TenantOverview({
  locale,
  settings,
  tenant,
}: {
  locale: string;
  settings: TenantSettingsFormState;
  tenant: Tenant;
}) {
  const t = useTranslations('SuperPortal.tenantDetails');

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={CheckCircle2}
            label={t('statusLabel')}
            value={tenant.isActive ? t('active') : t('inactive')}
          />
          <MetricTile icon={Globe} label={t('domainLabel')} value={tenant.domain || t('notSet')} />
          <MetricTile
            icon={Mail}
            label={t('supportEmailLabel')}
            value={settings.supportEmail || t('notSet')}
          />
          <MetricTile icon={Palette} label={t('primaryColorLabel')} value={settings.primaryColor} />
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
            <Settings className="h-5 w-5 text-primary" />
            {t('generalInfo')}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label={t('nameLabel')} value={tenant.name} />
            <DetailItem label={t('slugLabel')} value={tenant.slug} mono />
            <DetailItem label={t('domainLabel')} value={tenant.domain || t('notSet')} />
            <DetailItem label={t('createdAt')} value={formatDateTime(tenant.createdAt, locale)} />
            <DetailItem
              label={t('defaultLocaleLabel')}
              value={settings.defaultLocale.toUpperCase()}
            />
            <DetailItem
              label={t('featuresTitle')}
              value={[
                settings.aiTutorEnabled ? t('aiTutorEnabledLabel') : null,
                settings.activationCodesEnabled ? t('activationCodesEnabledLabel') : null,
              ]
                .filter(Boolean)
                .join(', ')}
            />
          </div>
        </div>
      </div>

      <TenantPreview settings={settings} tenant={tenant} />
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function DetailItem({ label, mono, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className={mono ? 'font-mono text-sm font-semibold' : 'text-sm font-semibold'}>{value}</p>
    </div>
  );
}

function TenantPreview({
  settings,
  tenant,
}: {
  settings: TenantSettingsFormState;
  tenant: Tenant;
}) {
  const t = useTranslations('SuperPortal.tenantDetails');
  const primaryColor = normalizeColor(settings.primaryColor);
  const displayName = settings.brandName || tenant.name;

  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
        <Building2 className="h-5 w-5 text-primary" />
        {t('portalPreview')}
      </h3>
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-foreground"
              style={
                settings.logoUrl
                  ? {
                      backgroundImage: `url(${settings.logoUrl})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }
                  : { backgroundColor: primaryColor, color: '#ffffff' }
              }
            >
              {settings.logoUrl ? null : displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {tenant.domain || `${tenant.slug}.lms.com`}
              </p>
            </div>
          </div>
          <span className="rounded-md border px-2 py-1 text-xs font-semibold">
            {settings.defaultLocale.toUpperCase()}
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div className="h-2 w-24 rounded-full" style={{ backgroundColor: primaryColor }} />
          <div className="h-2 w-full rounded-full bg-muted" />
          <div className="h-2 w-2/3 rounded-full bg-muted" />
          <button
            type="button"
            className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {t('previewAction')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TenantSettingsFormState {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  defaultLocale: 'vi' | 'en';
  supportEmail: string;
  maxStudents: string;
  maxCourses: string;
  aiTutorEnabled: boolean;
  activationCodesEnabled: boolean;
}

function TenantSettingsForm({ mode, tenant }: { mode: TenantSettingsTab; tenant: Tenant }) {
  const t = useTranslations('SuperPortal.tenantDetails');
  const updateTenant = useUpdateTenant();
  const [form, setForm] = useState<TenantSettingsFormState>(() =>
    normalizeTenantSettings(tenant.settings),
  );
  const savedForm = normalizeTenantSettings(tenant.settings);
  const isDirty = !formsEqual(form, savedForm);

  useEffect(() => {
    setForm(normalizeTenantSettings(tenant.settings));
  }, [tenant.id, tenant.settings]);

  const updateField = <K extends keyof TenantSettingsFormState>(
    key: K,
    value: TenantSettingsFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    updateTenant.mutate(
      {
        id: tenant.id,
        data: {
          settings: buildTenantSettings(tenant.settings, form),
        },
      },
      {
        onSuccess: () => {
          toast.success(t('settingsSaveSuccess'));
        },
        onError: () => {
          toast.error(t('settingsSaveError'));
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'branding' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-lg border bg-card p-5">
            <SectionHeading
              icon={Palette}
              title={t('brandingTitle')}
              description={t('brandingDesc')}
            />

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextField
                label={t('brandNameLabel')}
                value={form.brandName}
                placeholder={tenant.name}
                onChange={(value) => updateField('brandName', value)}
              />
              <TextField
                label={t('logoUrlLabel')}
                value={form.logoUrl}
                placeholder="https://example.com/logo.png"
                onChange={(value) => updateField('logoUrl', value)}
              />
              <div>
                <label className="mb-1 block text-sm font-bold">{t('primaryColorLabel')}</label>
                <div className="flex h-10 overflow-hidden rounded-lg border bg-background">
                  <input
                    type="color"
                    className="h-10 w-12 border-0 bg-transparent p-1"
                    value={normalizeColor(form.primaryColor)}
                    onChange={(event) => updateField('primaryColor', event.target.value)}
                  />
                  <input
                    type="text"
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                    value={form.primaryColor}
                    onChange={(event) => updateField('primaryColor', event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold">{t('defaultLocaleLabel')}</label>
                <select
                  value={form.defaultLocale}
                  onChange={(event) =>
                    updateField('defaultLocale', event.target.value as 'vi' | 'en')
                  }
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="vi">{t('localeVi')}</option>
                  <option value="en">{t('localeEn')}</option>
                </select>
              </div>
            </div>
          </section>

          <TenantPreview settings={form} tenant={tenant} />
        </div>
      )}

      {mode === 'access' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border bg-card p-5">
            <SectionHeading icon={Globe} title={t('supportTitle')} description={t('supportDesc')} />
            <div className="mt-5">
              <TextField
                label={t('supportEmailLabel')}
                type="email"
                value={form.supportEmail}
                placeholder="support@example.com"
                onChange={(value) => updateField('supportEmail', value)}
              />
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <SectionHeading
              icon={KeyRound}
              title={t('featuresTitle')}
              description={t('featuresDesc')}
            />
            <div className="mt-5 grid gap-3">
              <ToggleRow
                icon={Bot}
                title={t('aiTutorEnabledLabel')}
                description={t('aiTutorEnabledDesc')}
                checked={form.aiTutorEnabled}
                onChange={(checked) => updateField('aiTutorEnabled', checked)}
              />
              <ToggleRow
                icon={KeyRound}
                title={t('activationCodesEnabledLabel')}
                description={t('activationCodesEnabledDesc')}
                checked={form.activationCodesEnabled}
                onChange={(checked) => updateField('activationCodesEnabled', checked)}
              />
            </div>
          </section>
        </div>
      )}

      {mode === 'limits' && (
        <section className="rounded-lg border bg-card p-5">
          <SectionHeading
            icon={SlidersHorizontal}
            title={t('limitsTitle')}
            description={t('limitsDesc')}
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextField
              label={t('maxStudentsLabel')}
              type="number"
              min={0}
              value={form.maxStudents}
              placeholder="500"
              onChange={(value) => updateField('maxStudents', value)}
            />
            <TextField
              label={t('maxCoursesLabel')}
              type="number"
              min={0}
              value={form.maxCourses}
              placeholder="50"
              onChange={(value) => updateField('maxCourses', value)}
            />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <UsagePlaceholder icon={Users} label={t('studentUsage')} limit={form.maxStudents} />
            <UsagePlaceholder icon={BookOpen} label={t('courseUsage')} limit={form.maxCourses} />
          </div>
        </section>
      )}

      <div className="flex flex-col justify-end gap-3 border-t pt-5 sm:flex-row">
        <button
          type="button"
          disabled={!isDirty || updateTenant.isPending}
          onClick={() => setForm(savedForm)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          {t('resetChanges')}
        </button>
        <button
          type="submit"
          disabled={!isDirty || updateTenant.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
        >
          {updateTenant.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t('saveSettings')}
        </button>
      </div>
    </form>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h4 className="text-sm font-bold">{title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'email' | 'number' | 'text';
  min?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold">{label}</label>
      <input
        type={type}
        min={min}
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/40">
      <div className="flex min-w-0 gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-border text-primary"
      />
    </label>
  );
}

function UsagePlaceholder({
  icon: Icon,
  label,
  limit,
}: {
  icon: LucideIcon;
  label: string;
  limit: string;
}) {
  const t = useTranslations('SuperPortal.tenantDetails');
  const hasLimit = limit.trim().length > 0;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-0 rounded-full bg-primary" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {hasLimit ? t('usageLimit', { limit }) : t('usageUnlimited')}
      </p>
    </div>
  );
}

function formsEqual(a: TenantSettingsFormState, b: TenantSettingsFormState): boolean {
  return (
    a.brandName === b.brandName &&
    a.logoUrl === b.logoUrl &&
    a.primaryColor === b.primaryColor &&
    a.defaultLocale === b.defaultLocale &&
    a.supportEmail === b.supportEmail &&
    a.maxStudents === b.maxStudents &&
    a.maxCourses === b.maxCourses &&
    a.aiTutorEnabled === b.aiTutorEnabled &&
    a.activationCodesEnabled === b.activationCodesEnabled
  );
}

function normalizeTenantSettings(settings: Record<string, unknown>): TenantSettingsFormState {
  const branding = readRecord(settings.branding);
  const localization = readRecord(settings.localization);
  const support = readRecord(settings.support);
  const limits = readRecord(settings.limits);
  const features = readRecord(settings.features);

  return {
    brandName: readString(branding.brandName) || readString(settings.brandName),
    logoUrl: readString(branding.logoUrl) || readString(settings.logoUrl),
    primaryColor:
      readColor(branding.primaryColor) || readColor(settings.primaryColor) || DEFAULT_PRIMARY_COLOR,
    defaultLocale:
      readLocale(localization.defaultLocale) ||
      readLocale(settings.defaultLocale) ||
      DEFAULT_TENANT_LOCALE,
    supportEmail: readString(support.email) || readString(settings.supportEmail),
    maxStudents: readNumberString(limits.maxStudents) || readNumberString(settings.maxStudents),
    maxCourses: readNumberString(limits.maxCourses) || readNumberString(settings.maxCourses),
    aiTutorEnabled: readBoolean(features.aiTutorEnabled, true),
    activationCodesEnabled: readBoolean(features.activationCodesEnabled, true),
  };
}

function buildTenantSettings(
  currentSettings: Record<string, unknown>,
  form: TenantSettingsFormState,
): Record<string, unknown> {
  return {
    ...currentSettings,
    branding: {
      ...readRecord(currentSettings.branding),
      brandName: form.brandName.trim(),
      logoUrl: form.logoUrl.trim(),
      primaryColor: normalizeColor(form.primaryColor),
    },
    localization: {
      ...readRecord(currentSettings.localization),
      defaultLocale: form.defaultLocale,
    },
    support: {
      ...readRecord(currentSettings.support),
      email: form.supportEmail.trim(),
    },
    limits: {
      ...readRecord(currentSettings.limits),
      maxStudents: parseOptionalPositiveInt(form.maxStudents),
      maxCourses: parseOptionalPositiveInt(form.maxCourses),
    },
    features: {
      ...readRecord(currentSettings.features),
      aiTutorEnabled: form.aiTutorEnabled,
      activationCodesEnabled: form.activationCodesEnabled,
    },
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readColor(value: unknown): string {
  const color = readString(value);
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '';
}

function normalizeColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULT_PRIMARY_COLOR;
}

function readLocale(value: unknown): 'vi' | 'en' | '' {
  return value === 'vi' || value === 'en' ? value : '';
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readNumberString(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function parseOptionalPositiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
