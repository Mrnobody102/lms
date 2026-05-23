'use client';

import { use, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  ArrowLeft,
  Bot,
  Building2,
  Globe,
  KeyRound,
  Loader2,
  Palette,
  Save,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { LoginModal } from '@/features/auth/components/login-modal';
import { useAuthStore } from '@/features/auth/auth.store';
import { Tenant, useTenant, useUpdateTenant } from '@/hooks/use-tenants';
import { Link } from '@/navigation';

const DEFAULT_PRIMARY_COLOR = '#2563eb';
const DEFAULT_TENANT_LOCALE: 'vi' = 'vi';

export default function TenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('SuperPortal.tenantDetails');
  const locale = useLocale();
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

  return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="p-8 max-w-7xl mx-auto text-foreground">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToList')}
          </Link>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              {currentTenant.name}
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {currentTenant.domain || `${currentTenant.slug}.lms.com`}
            </p>
          </div>
          <div>
            {currentTenant.isActive ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <span className="w-2 h-2 rounded-full mr-2 bg-emerald-400" />
                {t('active')}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-red-500/10 text-red-400 border-red-500/20">
                <span className="w-2 h-2 rounded-full mr-2 bg-red-400" />
                {t('inactive')}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 bg-card border rounded-2xl p-6 h-fit shadow-sm">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">{t('generalInfo')}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">{t('nameLabel')}</p>
                <p className="font-semibold">{currentTenant.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">{t('slugLabel')}</p>
                <p className="font-mono text-xs bg-muted p-1 rounded inline-block">
                  {currentTenant.slug}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">{t('domainLabel')}</p>
                <p className="font-semibold">{currentTenant.domain || t('notSet')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">{t('createdAt')}</p>
                <p className="font-semibold">{formatDateTime(currentTenant.createdAt, locale)}</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  {t('settingsTitle')}
                </h3>
              </div>
              <TenantSettingsForm tenant={currentTenant} />
            </div>
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

function TenantSettingsForm({ tenant }: { tenant: Tenant }) {
  const t = useTranslations('SuperPortal.tenantDetails');
  const updateTenant = useUpdateTenant();
  const [form, setForm] = useState<TenantSettingsFormState>(() =>
    normalizeTenantSettings(tenant.settings),
  );

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
      <section className="space-y-4">
        <SectionHeading icon={Palette} title={t('brandingTitle')} description={t('brandingDesc')} />

        <div className="grid gap-4 md:grid-cols-2">
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
              onChange={(event) => updateField('defaultLocale', event.target.value as 'vi' | 'en')}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="vi">{t('localeVi')}</option>
              <option value="en">{t('localeEn')}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Globe} title={t('supportTitle')} description={t('supportDesc')} />
        <TextField
          label={t('supportEmailLabel')}
          type="email"
          value={form.supportEmail}
          placeholder="support@example.com"
          onChange={(value) => updateField('supportEmail', value)}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading
          icon={SlidersHorizontal}
          title={t('limitsTitle')}
          description={t('limitsDesc')}
        />
        <div className="grid gap-4 md:grid-cols-2">
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
      </section>

      <section className="space-y-4">
        <SectionHeading
          icon={KeyRound}
          title={t('featuresTitle')}
          description={t('featuresDesc')}
        />
        <div className="grid gap-3 md:grid-cols-2">
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

      <div className="flex justify-end border-t pt-5">
        <button
          type="submit"
          disabled={updateTenant.isPending}
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
