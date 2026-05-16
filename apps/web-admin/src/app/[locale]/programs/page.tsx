'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { usePrograms, useDeleteProgram } from '@/hooks/use-programs';
import { Button, Input, Separator, Skeleton, Alert, AlertDescription } from '@/components/ui';
import { FolderTree, AlertCircle, Search, Edit2, Trash2, Layers } from 'lucide-react';
import { Link } from '@/navigation';
import { Badge } from '@/components/ui';
import { useDebounce } from '@/hooks/use-debounce';

export default function ProgramsPage() {
  const t = useTranslations('Admin');
  const [search, setSearch] = useState('');

  const { data: programs, isLoading, error } = usePrograms();
  const deleteProgram = useDeleteProgram();
  const debouncedSearch = useDebounce(search, 300);

  const filteredPrograms = (programs || []).filter((p) =>
    p.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader title={t('programs')} description={t('programsDesc')} />

            <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between">
              <div className="flex h-10 flex-1 max-w-sm items-center rounded-lg border border-input bg-background text-foreground transition-colors focus-within:ring-2 focus-within:ring-primary/20">
                <Search className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t('searchPrograms')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <Link href="/programs/new">
                <Button>{t('createProgram')}</Button>
              </Link>
            </div>

            <Separator className="mb-8" />

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card border rounded-xl p-5 space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="w-8 h-8 rounded-md" />
                    </div>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : errorMessage ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : filteredPrograms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FolderTree className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('noPrograms')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">{t('noProgramsDesc')}</p>
                <Link href="/programs/new">
                  <Button>{t('createProgram')}</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrograms.map((program) => (
                  <div
                    key={program.id}
                    className="bg-card border rounded-xl p-5 flex flex-col gap-4 group hover:shadow-md hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FolderTree className="w-5 h-5" />
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/programs/${program.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (window.confirm(t('confirmDeleteProgram'))) {
                              deleteProgram.mutate(program.id);
                            }
                          }}
                          disabled={deleteProgram.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base line-clamp-2 leading-snug text-foreground group-hover:text-primary transition-colors">
                        <Link href={`/programs/${program.id}`}>{program.title}</Link>
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {program.description || t('noDescription')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs flex gap-1.5 items-center">
                        <Layers className="w-3.5 h-3.5" />
                        {program._count?.levels ?? 0} {t('levels')}
                      </Badge>
                      <Link href={`/programs/${program.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          {t('viewLevels')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
