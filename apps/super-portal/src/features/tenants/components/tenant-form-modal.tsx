'use client';

import { useEffect, useState } from 'react';
import { Loader2, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { Tenant, useCreateTenant, useUpdateTenant } from '@/hooks/use-tenants';

export function TenantFormModal({
  isOpen,
  onClose,
  tenant,
}: {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
}) {
  const t = useTranslations('SuperPortal.tenantForm');
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    slug: tenant?.slug || '',
    domain: tenant?.domain || '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: tenant?.name || '',
        slug: tenant?.slug || '',
        domain: tenant?.domain || '',
      });
    }
  }, [isOpen, tenant]);

  if (!isOpen) return null;

  const loading = createTenant.isPending || updateTenant.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error(t('requiredError'));
      return;
    }

    const payload = {
      ...formData,
      domain: formData.domain || undefined,
    };

    if (tenant) {
      updateTenant.mutate(
        { id: tenant.id, data: payload },
        {
          onSuccess: () => {
            toast.success(t('updateSuccess'));
            onClose();
          },
          onError: () => {
            toast.error(t('updateError'));
          },
        },
      );
    } else {
      createTenant.mutate(payload, {
        onSuccess: () => {
          toast.success(t('createSuccess'));
          onClose();
          setFormData({ name: '', slug: '', domain: '' });
        },
        onError: () => {
          toast.error(t('createError'));
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-2xl">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold">{tenant ? t('editTitle') : t('createTitle')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-bold">{t('nameLabel')}</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border bg-background px-4 py-2 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={t('namePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold">{t('slugLabel')}</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border bg-background px-4 py-2 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={t('slugPlaceholder')}
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
            <p className="mt-1 text-xs font-medium text-muted-foreground">{t('slugHint')}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold">{t('domainLabel')}</label>
            <input
              type="text"
              className="w-full rounded-lg border bg-background px-4 py-2 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={t('domainPlaceholder')}
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-bold text-muted-foreground transition-all hover:text-foreground"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              {tenant ? t('save') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
