'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { Link } from '@/navigation';
import { Button } from '@repo/ui';
import { useCohorts, Cohort } from '@/hooks/use-cohorts';
import { CohortModal } from '@/components/cohorts/cohort-modal';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { AdminHeader } from '@/components/layout/admin-header';

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

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirmDelete'))) {
      deleteCohort.mutate(id);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <AdminHeader title={t('cohorts.title')} description={t('cohorts.subtitle')} />
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('cohorts.createBtn')}
              </Button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">{t('common.loading')}</div>
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

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto pt-4 border-t border-border">
                      <Users className="w-4 h-4" />
                      <span>
                        {cohort._count?.memberships || 0} {t('cohorts.members')}
                      </span>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleDelete(cohort.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {cohorts.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">{t('cohorts.emptyStateTitle')}</h3>
                    <p className="text-muted-foreground mt-1">{t('cohorts.emptyStateDesc')}</p>
                  </div>
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
