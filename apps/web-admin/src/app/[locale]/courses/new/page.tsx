'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { AuthGuard } from '@/components/layout/auth-guard';
import { useCreateCourse } from '@/hooks/use-courses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Plus, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function NewCoursePage() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const { mutate: createCourse, isPending: loading, error: createError } = useCreateCourse();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLocalError(null);
    createCourse(
      { title },
      {
        onSuccess: (newCourse) => {
          router.push(`/courses/${newCourse.id}/edit`);
        },
        onError: () => {
          setLocalError(t('cannotCreateCourse'));
        },
      },
    );
  };

  const error = createError?.message ?? localError;

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-xl mx-auto">
            <AdminHeader title={t('createNewCourse')} description={t('createNewCourseDesc')} />
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t('backToList')}
            </Link>

            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{t('createNewCourse')}</h1>
                  <p className="text-sm text-muted-foreground">{t('createNewCourseDesc')}</p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('courseName')}</Label>
                  <Input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('courseNamePlaceholder')}
                    className="text-base"
                  />
                </div>
                <Button type="submit" disabled={loading || !title.trim()} className="w-full gap-2">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {t('startBuilding')}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('startBuildingDesc')}
                </p>
              </form>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
