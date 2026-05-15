'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button, Input, Skeleton, Alert, AlertDescription, Badge } from '@/components/ui';
import { ArrowLeft, Loader2, Plus, Edit2, Trash2, Layers, BookOpen } from 'lucide-react';
import { Link } from '@/navigation';
import { useProgram, useCreateLevel, useDeleteLevel } from '@/hooks/use-programs';

export default function ProgramDetailPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const programId = params.programId as string;

  const { data: program, isLoading, error } = useProgram(programId);
  const createLevel = useCreateLevel();
  const deleteLevel = useDeleteLevel();

  const [isAddingLevel, setIsAddingLevel] = useState(false);
  const [newLevelTitle, setNewLevelTitle] = useState('');

  const handleAddLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLevelTitle.trim()) return;

    try {
      await createLevel.mutateAsync({
        programId,
        data: {
          title: newLevelTitle,
          order: program?.levels?.length ?? 0,
        },
      });
      setNewLevelTitle('');
      setIsAddingLevel(false);
    } catch (err) {
      console.error(err);
      alert(t('errorCreatingLevel'));
    }
  };

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
              <Link href="/programs">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {isLoading ? <Skeleton className="h-8 w-64" /> : program?.title}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLoading ? (
                    <Skeleton className="h-4 w-48" />
                  ) : (
                    program?.description || t('noDescription')
                  )}
                </p>
              </div>
              {program && (
                <Link href={`/programs/${programId}/edit`}>
                  <Button variant="outline" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    {t('edit')}
                  </Button>
                </Link>
              )}
            </div>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    {t('levels')}
                    <Badge variant="secondary" className="ml-2">
                      {program?.levels?.length ?? 0}
                    </Badge>
                  </h2>
                  <Button onClick={() => setIsAddingLevel(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('addLevel')}
                  </Button>
                </div>

                {isAddingLevel && (
                  <div className="bg-card border rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleAddLevel} className="flex gap-3">
                      <Input
                        value={newLevelTitle}
                        onChange={(e) => setNewLevelTitle(e.target.value)}
                        placeholder={t('levelTitlePlaceholder')}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingLevel(false)}
                      >
                        {t('cancel')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={!newLevelTitle.trim() || createLevel.isPending}
                      >
                        {createLevel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('save')}
                      </Button>
                    </form>
                  </div>
                )}

                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : program?.levels?.length === 0 ? (
                  <div className="text-center py-12 border rounded-xl border-dashed">
                    <p className="text-muted-foreground">{t('noLevelsDesc')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {program?.levels?.map((level) => (
                      <div
                        key={level.id}
                        className="bg-card border rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-colors"
                      >
                        <div>
                          <h3 className="font-medium text-foreground">{level.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <BookOpen className="h-3 w-3" />
                            {level._count?.courses ?? 0} {t('courses')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (window.confirm(t('confirmDeleteLevel'))) {
                                deleteLevel.mutate({ programId, levelId: level.id });
                              }
                            }}
                            disabled={deleteLevel.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
