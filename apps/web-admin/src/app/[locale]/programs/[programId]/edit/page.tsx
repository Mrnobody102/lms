'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useProgram, useUpdateProgram } from '@/hooks/use-programs';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button, Input, Label, Skeleton, Alert, AlertDescription } from '@/components/ui';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Link } from '@/navigation';

export default function EditProgramPage() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const params = useParams();
  const programId = params.programId as string;

  const { data: program, isLoading: isProgramLoading, error } = useProgram(programId);
  const updateProgram = useUpdateProgram();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (program) {
      setTitle(program.title || '');
      setDescription(program.description || '');
    }
  }, [program]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProgram.mutateAsync({
        id: programId,
        data: { title, description },
      });
      router.push(`/programs/${programId}`);
    } catch (error) {
      console.error('Failed to update program:', error);
      alert(t('errorUpdatingProgram'));
    }
  };

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
              <Link href={`/programs/${programId}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('editProgram')}</h1>
                <p className="text-sm text-muted-foreground">{t('editProgramDesc')}</p>
              </div>
            </div>

            {isProgramLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : errorMessage ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : (
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('title')}</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('description')}</Label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setDescription(e.target.value)
                      }
                      rows={4}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Link href={`/programs/${programId}`}>
                      <Button type="button" variant="outline">
                        {t('cancel')}
                      </Button>
                    </Link>
                    <Button type="submit" disabled={updateProgram.isPending || !title.trim()}>
                      {updateProgram.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('save')}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
