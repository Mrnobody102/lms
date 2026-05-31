'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Users, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { Link } from '@/navigation';
import { Button, EmptyState, LoadingState } from '@repo/ui';
import { useCohorts, Cohort } from '@/hooks/use-cohorts';
import { CohortModal } from '@/components/cohorts/cohort-modal';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { AdminHeader } from '@/components/layout/admin-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';

export default function CohortsPage() {
  const t = useTranslations('Admin');
  const { cohorts, isLoading, deleteCohort } = useCohorts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);

  const handleEdit = (cohort: Cohort) => {
    setEditingCohort(cohort);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCohort(null);
    setIsModalOpen(true);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-[var(--admin-sidebar-width)] p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <AdminHeader title={t('cohorts.title')} description={t('cohorts.subtitle')} />
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('cohorts.createBtn')}
              </Button>
            </div>

            {isLoading ? (
              <LoadingState title={t('common.loading')} className="rounded-md border" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{cohort.name}</h3>
                        {cohort.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {cohort.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${cohort.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}
                      >
                        {cohort.isActive ? t('common.active') : t('common.inactive')}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-auto pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>
                          {cohort._count?.memberships || 0} {t('cohorts.members')}
                        </span>
                      </div>
                      {cohort.instructor && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          <span>{cohort.instructor.fullName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Link href={`/cohorts/${cohort.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          {t('cohorts.manageBtn')}
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cohort)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <ConfirmDialog
                        description={t('common.confirmDelete')}
                        destructive
                        onConfirm={() => deleteCohort.mutate(cohort.id)}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </div>
                ))}

                {cohorts.length === 0 && (
                  <EmptyState
                    icon={Users}
                    title={t('cohorts.emptyStateTitle')}
                    description={t('cohorts.emptyStateDesc')}
                    action={<Button onClick={handleCreate}>{t('cohorts.createBtn')}</Button>}
                    className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 py-12"
                  />
                )}
              </div>
            )}

            <CohortModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              cohort={editingCohort}
            />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
