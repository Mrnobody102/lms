'use client';

import { useState } from 'react';
import { Edit2, Eye, RefreshCcw, ShieldAlert, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useRouter } from '../../../navigation';
import { Tenant, useDeleteTenant, useRestoreTenant } from '@/hooks/use-tenants';
import { TenantFormModal } from './tenant-form-modal';

export function TenantActions({ tenant }: { tenant: Tenant }) {
  const t = useTranslations('SuperPortal.tenantActions');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();
  const deleteTenant = useDeleteTenant();
  const restoreTenant = useRestoreTenant();

  const handleDelete = () => {
    deleteTenant.mutate(tenant.id, {
      onSuccess: () => {
        toast.success(t('deactivateSuccess'));
        setIsDeleteModalOpen(false);
      },
      onError: () => {
        toast.error(t('deactivateError'));
      },
    });
  };

  const handleRestore = () => {
    restoreTenant.mutate(tenant.id, {
      onSuccess: () => {
        toast.success(t('restoreSuccess'));
      },
      onError: () => {
        toast.error(t('restoreError'));
      },
    });
  };

  const loading = deleteTenant.isPending || restoreTenant.isPending;

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => router.push(`/tenants/${tenant.id}`)}
        title={t('viewDetails')}
        aria-label={t('viewDetails')}
        className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
      >
        <Eye className="h-4 w-4" />
      </button>

      <button
        onClick={() => setIsEditModalOpen(true)}
        title={t('edit')}
        aria-label={t('edit')}
        className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
      >
        <Edit2 className="h-4 w-4" />
      </button>

      {tenant.isActive ? (
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          title={t('deactivate')}
          aria-label={t('deactivate')}
          className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={handleRestore}
          disabled={loading}
          title={t('restore')}
          aria-label={t('restore')}
          className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-emerald-500/10 hover:text-emerald-500 disabled:opacity-50"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      )}

      <TenantFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        tenant={tenant}
      />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border bg-card p-8 text-center shadow-2xl">
            <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-xl font-bold">{t('confirmTitle')}</h3>
            <p className="mb-6 text-sm font-medium text-muted-foreground">
              {t('confirmDescription', { name: tenant.name })}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-sm font-bold text-muted-foreground transition-all hover:text-foreground"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground shadow-md transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
              >
                {loading ? t('processing') : t('confirmDeactivate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
